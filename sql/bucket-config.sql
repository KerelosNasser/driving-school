-- Supabase Storage Bucket Configuration for Driving School

-- Create buckets for different file types
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
VALUES
-- Student Documents Bucket
('student_documents', 'student_documents',
 (SELECT id FROM auth.users WHERE email = 'admin@drivingschool.com' LIMIT 1),
    NOW(), NOW(), false),

-- Instructor Certificates Bucket
('instructor_certificates', 'instructor_certificates',
 (SELECT id FROM auth.users WHERE email = 'admin@drivingschool.com' LIMIT 1),
 NOW(), NOW(), false),

-- Vehicle Maintenance Records Bucket
('vehicle_records', 'vehicle_records',
 (SELECT id FROM auth.users WHERE email = 'admin@drivingschool.com' LIMIT 1),
 NOW(), NOW(), false);

-- RLS Policies for Storage Buckets

-- Student Documents Bucket Policies
CREATE POLICY "Students can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'student_documents' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Students can view their own documents"
ON storage.objects FOR SELECT
                                         TO authenticated
                                         USING (
                                         bucket_id = 'student_documents' AND
                                         (storage.foldername(name))[1] = (SELECT auth.uid())::text
                                         );

CREATE POLICY "Instructors can view student documents"
ON storage.objects FOR SELECT
                                  TO authenticated
                                  USING (
                                  bucket_id = 'student_documents' AND
                                  (auth.jwt() ->> 'user_role') = 'instructor'
                                  );

-- Instructor Certificates Bucket Policies
CREATE POLICY "Instructors can upload their certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'instructor_certificates' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Instructors can view their own certificates"
ON storage.objects FOR SELECT
                                         TO authenticated
                                         USING (
                                         bucket_id = 'instructor_certificates' AND
                                         (storage.foldername(name))[1] = (SELECT auth.uid())::text
                                         );

CREATE POLICY "Admins can view all instructor certificates"
ON storage.objects FOR SELECT
                                  TO authenticated
                                  USING (
                                  bucket_id = 'instructor_certificates' AND
                                  (auth.jwt() ->> 'user_role') = 'admin'
                                  );

-- Vehicle Records Bucket Policies
CREATE POLICY "Instructors can upload vehicle records"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'vehicle_records' AND
    (auth.jwt() ->> 'user_role') IN ('instructor', 'admin')
);

CREATE POLICY "Instructors and admins can view vehicle records"
ON storage.objects FOR SELECT
                                         TO authenticated
                                         USING (
                                         bucket_id = 'vehicle_records' AND
                                         (auth.jwt() ->> 'user_role') IN ('instructor', 'admin')
                                         );

-- File Type and Size Restrictions (Optional)
CREATE OR REPLACE FUNCTION storage.validate_file_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate file extensions
    IF NEW.name !~ '\.(pdf|jpg|jpeg|png|doc|docx)$' THEN
        RAISE EXCEPTION 'Invalid file type';
END IF;

    -- Validate file size (max 10MB)
    IF NEW.metadata->>'size'::bigint > 10485760 THEN
        RAISE EXCEPTION 'File too large. Maximum size is 10MB';
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate uploads across all buckets
CREATE TRIGGER validate_upload
    BEFORE INSERT OR UPDATE ON storage.objects
                         FOR EACH ROW EXECUTE FUNCTION storage.validate_file_upload();