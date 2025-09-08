

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_action" "text", "p_limit" integer, "p_window_minutes" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_attempt_count INTEGER;
BEGIN
    -- Count attempts in the time window
    SELECT COUNT(*) INTO v_attempt_count
    FROM referral_attempts ra
    LEFT JOIN users u ON ra.referred_user_id = u.id
    WHERE (
        ra.ip_address::text = p_identifier OR 
        u.clerk_id = p_identifier
    )
    AND ra.created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    RETURN v_attempt_count < p_limit;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_action" "text", "p_limit" integer, "p_window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_versions"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Keep only last 50 versions per content key
    DELETE FROM content_versions cv1
    WHERE cv1.id NOT IN (
        SELECT cv2.id 
        FROM content_versions cv2 
        WHERE cv2.page_name = cv1.page_name 
        AND cv2.content_key = cv1.content_key
        ORDER BY cv2.created_at DESC 
        LIMIT 50
    );
    
    -- Delete versions older than 90 days
    DELETE FROM content_versions
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_versions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_media"("dry_run" boolean DEFAULT true) RETURNS TABLE("action" "text", "file_id" "uuid", "file_name" character varying, "storage_path" character varying, "reason" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    IF dry_run THEN
        -- Return what would be deleted without actually deleting
        RETURN QUERY
        SELECT 
            'WOULD DELETE'::TEXT as action,
            mf.id as file_id,
            mf.file_name,
            mf.storage_path,
            'File not referenced in any content and older than 30 days'::TEXT as reason
        FROM media_files mf
        WHERE 
            mf.is_active = true
            AND mf.content_key IS NULL
            AND mf.created_at < NOW() - INTERVAL '30 days'
            AND NOT EXISTS (
                SELECT 1 FROM page_content pc 
                WHERE pc.content_json->>'url' = mf.public_url
                OR pc.content_value LIKE '%' || mf.public_url || '%'
                OR pc.file_url = mf.public_url
            );
    ELSE
        -- Actually perform the cleanup
        UPDATE media_files 
        SET is_active = false, deleted_at = NOW()
        WHERE 
            is_active = true
            AND content_key IS NULL
            AND created_at < NOW() - INTERVAL '30 days'
            AND NOT EXISTS (
                SELECT 1 FROM page_content pc 
                WHERE pc.content_json->>'url' = public_url
                OR pc.content_value LIKE '%' || public_url || '%'
                OR pc.file_url = public_url
            );
            
        RETURN QUERY
        SELECT 
            'DELETED'::TEXT as action,
            mf.id as file_id,
            mf.file_name,
            mf.storage_path,
            'File not referenced in any content and older than 30 days'::TEXT as reason
        FROM media_files mf
        WHERE 
            mf.is_active = false
            AND mf.deleted_at IS NOT NULL
            AND mf.deleted_at > NOW() - INTERVAL '1 minute';
    END IF;
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_media"("dry_run" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_folder_files"("folder_uuid" "uuid", "include_subfolders" boolean DEFAULT false) RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    file_count INTEGER := 0;
    subfolder_count INTEGER := 0;
BEGIN
    -- Count direct files in folder
    SELECT COUNT(*) INTO file_count 
    FROM media_files 
    WHERE folder_id = folder_uuid AND is_active = true;
    
    -- If including subfolders, count recursively
    IF include_subfolders THEN
        SELECT COALESCE(SUM(count_folder_files(id, true)), 0) INTO subfolder_count
        FROM media_folders 
        WHERE parent_id = folder_uuid;
        
        file_count := file_count + subfolder_count;
    END IF;
    
    RETURN file_count;
END;
$$;


ALTER FUNCTION "public"."count_folder_files"("folder_uuid" "uuid", "include_subfolders" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_content_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only create version for updates, not inserts
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO content_versions (
            page_name,
            content_key,
            content_type,
            content_value,
            content_json,
            file_url,
            alt_text,
            version,
            created_by,
            change_description
        ) VALUES (
            OLD.page_name,
            OLD.content_key,
            OLD.content_type,
            OLD.content_value,
            OLD.content_json,
            OLD.file_url,
            OLD.alt_text,
            COALESCE(OLD.version, 'v' || extract(epoch from now())::text),
            COALESCE(OLD.updated_by, 'system'),
            'Auto-saved version before update'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_content_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_invitation_code"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_code TEXT;
BEGIN
    -- Deactivate existing codes
    UPDATE invitation_codes 
    SET is_active = FALSE 
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    -- Generate new code
    v_code := generate_invitation_code();
    
    -- Insert new invitation code
    INSERT INTO invitation_codes (user_id, code, is_active)
    VALUES (p_user_id, v_code, TRUE);
    
    -- Update user's invitation code
    UPDATE users SET invitation_code = v_code WHERE id = p_user_id;
    
    RETURN v_code;
END;
$$;


ALTER FUNCTION "public"."create_user_invitation_code"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_content_conflict"("p_page_name" character varying, "p_content_key" character varying, "p_expected_version" character varying) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_version VARCHAR(50);
BEGIN
    SELECT version INTO current_version
    FROM page_content
    WHERE page_name = p_page_name AND content_key = p_content_key;
    
    -- If no current version or versions match, no conflict
    IF current_version IS NULL OR current_version = p_expected_version THEN
        RETURN FALSE;
    END IF;
    
    -- Update conflict timestamp
    UPDATE page_content 
    SET last_conflict_at = NOW()
    WHERE page_name = p_page_name AND content_key = p_content_key;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."detect_content_conflict"("p_page_name" character varying, "p_content_key" character varying, "p_expected_version" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_referral_fraud"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_fraud_score INTEGER := 0;
    v_fraud_reasons TEXT[] := '{}';
    v_referrer_user_id UUID;
    v_similar_device_count INTEGER;
    v_recent_attempts INTEGER;
    v_ip_attempts INTEGER;
    v_result JSONB;
BEGIN
    -- Get referrer user ID
    SELECT user_id INTO v_referrer_user_id
    FROM invitation_codes
    WHERE code = p_invitation_code AND is_active = TRUE;
    
    IF v_referrer_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'fraud_score', 100,
            'reasons', ARRAY['invalid_invitation_code']
        );
    END IF;
    
    -- Check 1: Same device fingerprint used by multiple users (last 30 days)
    SELECT COUNT(DISTINCT user_id) INTO v_similar_device_count
    FROM device_fingerprints
    WHERE fingerprint_hash = p_device_fingerprint
      AND created_at > NOW() - INTERVAL '30 days'
      AND user_id != p_referred_user_id;
    
    IF v_similar_device_count > 0 THEN
        v_fraud_score := v_fraud_score + 50;
        v_fraud_reasons := array_append(v_fraud_reasons, 'device_already_used');
    END IF;
    
    -- Check 2: Too many referral attempts from same IP (last 24 hours)
    SELECT COUNT(*) INTO v_ip_attempts
    FROM referral_attempts
    WHERE ip_address = p_ip_address
      AND created_at > NOW() - INTERVAL '24 hours';
    
    IF v_ip_attempts >= 5 THEN
        v_fraud_score := v_fraud_score + 30;
        v_fraud_reasons := array_append(v_fraud_reasons, 'too_many_ip_attempts');
    END IF;
    
    -- Check 3: Too many attempts with same invitation code (last 24 hours)
    SELECT COUNT(*) INTO v_recent_attempts
    FROM referral_attempts
    WHERE invitation_code = p_invitation_code
      AND created_at > NOW() - INTERVAL '24 hours';
    
    IF v_recent_attempts >= 3 THEN
        v_fraud_score := v_fraud_score + 20;
        v_fraud_reasons := array_append(v_fraud_reasons, 'too_many_code_attempts');
    END IF;
    
    -- Check 4: Self-referral attempt
    IF v_referrer_user_id = p_referred_user_id THEN
        v_fraud_score := 100;
        v_fraud_reasons := array_append(v_fraud_reasons, 'self_referral');
    END IF;
    
    -- Check 5: User already has a referral (prevent multiple referrals per user)
    IF EXISTS (
        SELECT 1 FROM referrals 
        WHERE referred_user_id = p_referred_user_id
    ) THEN
        v_fraud_score := v_fraud_score + 60;
        v_fraud_reasons := array_append(v_fraud_reasons, 'user_already_referred');
    END IF;
    
    -- Log the attempt
    INSERT INTO referral_attempts (
        invitation_code,
        referred_user_id,
        device_fingerprint,
        ip_address,
        user_agent,
        status,
        failure_reason
    ) VALUES (
        p_invitation_code,
        p_referred_user_id,
        p_device_fingerprint,
        p_ip_address,
        p_user_agent,
        CASE WHEN v_fraud_score >= 70 THEN 'blocked' ELSE 'attempted' END,
        CASE WHEN v_fraud_score >= 70 THEN array_to_string(v_fraud_reasons, ', ') ELSE NULL END
    );
    
    -- Log suspicious activity if high fraud score
    IF v_fraud_score >= 50 THEN
        INSERT INTO suspicious_activities (
            activity_type,
            user_id,
            ip_address,
            device_fingerprint,
            details,
            severity
        ) VALUES (
            'suspicious_pattern',
            p_referred_user_id,
            p_ip_address,
            p_device_fingerprint,
            jsonb_build_object(
                'fraud_score', v_fraud_score,
                'reasons', v_fraud_reasons,
                'invitation_code', p_invitation_code,
                'referrer_user_id', v_referrer_user_id
            ),
            CASE 
                WHEN v_fraud_score >= 90 THEN 'critical'
                WHEN v_fraud_score >= 70 THEN 'high'
                ELSE 'medium'
            END
        );
    END IF;
    
    -- Return result
    RETURN jsonb_build_object(
        'allowed', v_fraud_score < 70,
        'fraud_score', v_fraud_score,
        'reasons', v_fraud_reasons,
        'requires_manual_review', v_fraud_score >= 50 AND v_fraud_score < 70
    );
END;
$$;


ALTER FUNCTION "public"."detect_referral_fraud"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invitation_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM invitation_codes WHERE invitation_codes.code = code) INTO exists;
        
        -- If code doesn't exist, return it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_invitation_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_storage_path"("file_type" "text", "file_extension" "text" DEFAULT 'jpg'::"text", "subfolder" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    date_path TEXT;
    type_folder TEXT;
    final_path TEXT;
BEGIN
    -- Generate date-based path (YYYY/MM)
    date_path := TO_CHAR(NOW(), 'YYYY/MM');
    
    -- Determine type folder
    CASE file_type
        WHEN 'image' THEN type_folder := 'images';
        WHEN 'video' THEN type_folder := 'videos';
        WHEN 'audio' THEN type_folder := 'audio';
        WHEN 'document' THEN type_folder := 'documents';
        ELSE type_folder := 'other';
    END CASE;
    
    -- Build final path
    final_path := 'media-library/' || type_folder || '/' || date_path;
    
    -- Add subfolder if specified
    IF subfolder IS NOT NULL AND subfolder != '' THEN
        final_path := final_path || '/' || subfolder;
    END IF;
    
    -- Add filename with timestamp and UUID
    final_path := final_path || '/' || 
                 EXTRACT(EPOCH FROM NOW())::TEXT || '_' || 
                 gen_random_uuid()::TEXT || '.' || 
                 file_extension;
    
    RETURN final_path;
END;
$$;


ALTER FUNCTION "public"."generate_storage_path"("file_type" "text", "file_extension" "text", "subfolder" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_content_by_section"("section_name" "text") RETURNS TABLE("id" "uuid", "content_key" "text", "content_type" "text", "content_value" "text", "content_json" "jsonb", "file_path" "text", "alt_text" "text", "title" "text", "display_order" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.content_key,
        sc.content_type,
        sc.content_value,
        sc.content_json,
        sc.file_path,
        sc.alt_text,
        sc.title,
        sc.display_order
    FROM site_content sc
    WHERE sc.page_section = section_name 
      AND sc.is_active = true 
      AND sc.is_draft = false
    ORDER BY sc.display_order;
END;
$$;


ALTER FUNCTION "public"."get_content_by_section"("section_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_folder_path"("folder_uuid" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    folder_path TEXT := '';
    current_folder media_folders%ROWTYPE;
BEGIN
    IF folder_uuid IS NULL THEN
        RETURN '';
    END IF;
    
    -- Get current folder
    SELECT * INTO current_folder FROM media_folders WHERE id = folder_uuid;
    
    IF NOT FOUND THEN
        RETURN '';
    END IF;
    
    -- Build path recursively
    IF current_folder.parent_id IS NOT NULL THEN
        folder_path := get_folder_path(current_folder.parent_id) || '/' || current_folder.name;
    ELSE
        folder_path := current_folder.name;
    END IF;
    
    RETURN folder_path;
END;
$$;


ALTER FUNCTION "public"."get_folder_path"("folder_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_storage_stats"() RETURNS TABLE("total_files" bigint, "total_size" bigint, "total_size_mb" numeric, "files_by_type" "jsonb", "size_by_type" "jsonb", "recent_uploads" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH file_stats AS (
        SELECT 
            mf.file_type,
            COUNT(*) as file_count,
            SUM(mf.file_size) as total_size,
            COUNT(*) FILTER (WHERE mf.created_at > NOW() - INTERVAL '7 days') as recent_count
        FROM media_files mf 
        WHERE mf.is_active = true
        GROUP BY mf.file_type
    ),
    aggregated_stats AS (
        SELECT 
            SUM(file_count) as total_files,
            SUM(total_size) as total_size,
            ROUND(SUM(total_size) / 1024.0 / 1024.0, 2) as total_size_mb,
            jsonb_object_agg(file_type, file_count) as files_by_type,
            jsonb_object_agg(file_type, ROUND(total_size / 1024.0 / 1024.0, 2)) as size_by_type,
            SUM(recent_count) as recent_uploads
        FROM file_stats
    )
    SELECT * FROM aggregated_stats;
END;
$$;


ALTER FUNCTION "public"."get_storage_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("user_clerk_id" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID;
    v_count INTEGER;
BEGIN
    -- Get user ID from Clerk ID
    SELECT id INTO v_user_id 
    FROM users 
    WHERE clerk_id = user_clerk_id;
    
    IF v_user_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count unread notifications
    SELECT COUNT(*) INTO v_count
    FROM user_notifications 
    WHERE user_id = v_user_id AND is_read = FALSE;
    
    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("user_clerk_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_content_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Log changes to content_value
    IF OLD.content_value IS DISTINCT FROM NEW.content_value THEN
        INSERT INTO site_content_history (content_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'content_value', OLD.content_value, NEW.content_value, NEW.updated_by);
    END IF;
    
    -- Log changes to content_json
    IF OLD.content_json IS DISTINCT FROM NEW.content_json THEN
        INSERT INTO site_content_history (content_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'content_json', OLD.content_json::text, NEW.content_json::text, NEW.updated_by);
    END IF;
    
    -- Log changes to file_path (image changes)
    IF OLD.file_path IS DISTINCT FROM NEW.file_path THEN
        INSERT INTO site_content_history (content_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'file_path', OLD.file_path, NEW.file_path, NEW.updated_by);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_content_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("notification_id" "uuid", "user_clerk_id" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID from Clerk ID
    SELECT id INTO v_user_id 
    FROM users 
    WHERE clerk_id = user_clerk_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Update notification
    UPDATE user_notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = notification_id AND user_id = v_user_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("notification_id" "uuid", "user_clerk_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_referral"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_referral_id UUID;
    v_referrer_user_id UUID;
    v_invitation_code_id UUID;
    v_referral_count INTEGER;
    v_reward_type TEXT;
    v_reward_value DECIMAL(10,2);
BEGIN
    -- Find the invitation code and referrer
    SELECT ic.id, ic.user_id INTO v_invitation_code_id, v_referrer_user_id
    FROM invitation_codes ic
    WHERE ic.code = p_invitation_code 
      AND ic.is_active = TRUE
      AND (ic.expires_at IS NULL OR ic.expires_at > NOW())
      AND (ic.max_uses IS NULL OR ic.current_uses < ic.max_uses);
    
    IF v_referrer_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;
    
    -- Prevent self-referral
    IF v_referrer_user_id = p_referred_user_id THEN
        RAISE EXCEPTION 'Cannot use your own invitation code';
    END IF;
    
    -- Create referral record
    INSERT INTO referrals (
        referrer_user_id, referred_user_id, invitation_code_id,
        device_fingerprint, ip_address, status
    ) VALUES (
        v_referrer_user_id, p_referred_user_id, v_invitation_code_id,
        p_device_fingerprint, p_ip_address, 'completed'
    ) RETURNING id INTO v_referral_id;
    
    -- Update invitation code usage
    UPDATE invitation_codes 
    SET current_uses = current_uses + 1
    WHERE id = v_invitation_code_id;
    
    -- Count total successful referrals for referrer
    SELECT COUNT(*) INTO v_referral_count
    FROM referrals
    WHERE referrer_user_id = v_referrer_user_id AND status = 'completed';
    
    -- Determine reward based on referral count
    IF v_referral_count = 1 THEN
        v_reward_type := 'discount_30_percent';
        v_reward_value := 30.00;
    ELSIF v_referral_count >= 3 THEN
        v_reward_type := 'free_hours_2';
        v_reward_value := 2.00;
    END IF;
    
    -- Create reward if applicable
    IF v_reward_type IS NOT NULL THEN
        INSERT INTO referral_rewards (
            user_id, referral_id, reward_type, reward_value
        ) VALUES (
            v_referrer_user_id, v_referral_id, v_reward_type, v_reward_value
        );
        
        -- If it's free hours, add to quota
        IF v_reward_type = 'free_hours_2' THEN
            PERFORM update_user_quota(
                v_referrer_user_id,
                v_reward_value,
                'free_credit',
                'Referral reward: 2 free hours for 3+ successful referrals',
                NULL, NULL, NULL, NULL,
                jsonb_build_object('referral_id', v_referral_id, 'reward_type', v_reward_type)
            );
        END IF;
    END IF;
    
    RETURN v_referral_id;
END;
$$;


ALTER FUNCTION "public"."process_referral"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_referral_secure"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_referral_id UUID;
    v_referrer_user_id UUID;
    v_invitation_code_id UUID;
    v_referral_count INTEGER;
    v_reward_type TEXT;
    v_reward_value DECIMAL(10,2);
    v_fraud_check JSONB;
BEGIN
    -- Run fraud detection
    v_fraud_check := detect_referral_fraud(
        p_referred_user_id,
        p_invitation_code,
        p_device_fingerprint,
        p_ip_address,
        p_user_agent
    );
    
    -- Block if fraud detected
    IF NOT (v_fraud_check->>'allowed')::boolean THEN
        RAISE EXCEPTION 'Referral blocked due to security concerns: %', 
            array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_fraud_check->'reasons')), ', ');
    END IF;
    
    -- Flag for manual review if needed
    IF (v_fraud_check->>'requires_manual_review')::boolean THEN
        -- Still process but mark for review
        INSERT INTO suspicious_activities (
            activity_type,
            user_id,
            details,
            severity
        ) VALUES (
            'blocked_referral',
            p_referred_user_id,
            jsonb_build_object(
                'message', 'Referral flagged for manual review',
                'fraud_check', v_fraud_check
            ),
            'medium'
        );
    END IF;
    
    -- Find the invitation code and referrer (original process_referral logic)
    SELECT ic.id, ic.user_id INTO v_invitation_code_id, v_referrer_user_id
    FROM invitation_codes ic
    WHERE ic.code = p_invitation_code 
      AND ic.is_active = TRUE
      AND (ic.expires_at IS NULL OR ic.expires_at > NOW())
      AND (ic.max_uses IS NULL OR ic.current_uses < ic.max_uses);
    
    IF v_referrer_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;
    
    -- Prevent self-referral (double check)
    IF v_referrer_user_id = p_referred_user_id THEN
        RAISE EXCEPTION 'Cannot use your own invitation code';
    END IF;
    
    -- Create referral record
    INSERT INTO referrals (
        referrer_user_id, referred_user_id, invitation_code_id,
        device_fingerprint, ip_address, status
    ) VALUES (
        v_referrer_user_id, p_referred_user_id, v_invitation_code_id,
        p_device_fingerprint, p_ip_address, 'completed'
    ) RETURNING id INTO v_referral_id;
    
    -- Update invitation code usage
    UPDATE invitation_codes 
    SET current_uses = current_uses + 1
    WHERE id = v_invitation_code_id;
    
    -- Update referral attempt status
    UPDATE referral_attempts
    SET status = 'successful'
    WHERE invitation_code = p_invitation_code
      AND referred_user_id = p_referred_user_id
      AND status = 'attempted'
      AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Count total successful referrals for referrer
    SELECT COUNT(*) INTO v_referral_count
    FROM referrals
    WHERE referrer_user_id = v_referrer_user_id AND status = 'completed';
    
    -- Determine reward based on referral count
    IF v_referral_count = 1 THEN
        v_reward_type := 'discount_30_percent';
        v_reward_value := 30.00;
    ELSIF v_referral_count >= 3 THEN
        v_reward_type := 'free_hours_2';
        v_reward_value := 2.00;
    END IF;
    
    -- Create reward if applicable
    IF v_reward_type IS NOT NULL THEN
        INSERT INTO referral_rewards (
            user_id, referral_id, reward_type, reward_value
        ) VALUES (
            v_referrer_user_id, v_referral_id, v_reward_type, v_reward_value
        );
        
        -- If it's free hours, add to quota
        IF v_reward_type = 'free_hours_2' THEN
            PERFORM update_user_quota(
                v_referrer_user_id,
                v_reward_value,
                'free_credit',
                'Referral reward: 2 free hours for 3+ successful referrals',
                NULL, NULL, NULL, NULL,
                jsonb_build_object('referral_id', v_referral_id, 'reward_type', v_reward_type)
            );
        END IF;
    END IF;
    
    RETURN v_referral_id;
END;
$$;


ALTER FUNCTION "public"."process_referral_secure"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_media_files"("search_term" "text" DEFAULT ''::"text", "file_types" "text"[] DEFAULT ARRAY['image'::"text", 'video'::"text", 'audio'::"text", 'document'::"text", 'other'::"text"], "folder_uuid" "uuid" DEFAULT NULL::"uuid", "include_subfolders" boolean DEFAULT false, "limit_count" integer DEFAULT 50, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "original_name" character varying, "file_name" character varying, "storage_path" character varying, "public_url" "text", "file_type" character varying, "mime_type" character varying, "file_size" bigint, "width" integer, "height" integer, "duration" double precision, "alt_text" "text", "caption" "text", "description" "text", "folder_id" "uuid", "folder_name" "text", "folder_path" "text", "tags" "text"[], "uploaded_by" character varying, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mf.id,
        mf.original_name,
        mf.file_name,
        mf.storage_path,
        mf.public_url,
        mf.file_type,
        mf.mime_type,
        mf.file_size,
        mf.width,
        mf.height,
        mf.duration,
        mf.alt_text,
        mf.caption,
        mf.description,
        mf.folder_id,
        COALESCE(folder.name, 'Root') as folder_name,
        COALESCE(get_folder_path(mf.folder_id), '') as folder_path,
        mf.tags,
        mf.uploaded_by,
        mf.created_at,
        mf.updated_at
    FROM media_files mf
    LEFT JOIN media_folders folder ON mf.folder_id = folder.id
    WHERE 
        mf.is_active = true
        AND mf.file_type = ANY(file_types)
        AND (
            folder_uuid IS NULL 
            OR mf.folder_id = folder_uuid
            OR (include_subfolders AND mf.folder_id IN (
                SELECT id FROM media_folders 
                WHERE parent_id = folder_uuid OR id = folder_uuid
            ))
        )
        AND (
            search_term = '' 
            OR mf.original_name ILIKE '%' || search_term || '%'
            OR mf.alt_text ILIKE '%' || search_term || '%'
            OR mf.description ILIKE '%' || search_term || '%'
            OR mf.caption ILIKE '%' || search_term || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(mf.tags) AS tag 
                WHERE tag ILIKE '%' || search_term || '%'
            )
        )
    ORDER BY mf.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;


ALTER FUNCTION "public"."search_media_files"("search_term" "text", "file_types" "text"[], "folder_uuid" "uuid", "include_subfolders" boolean, "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."simple_upsert_content"("p_page_name" character varying, "p_content_key" character varying, "p_content_type" character varying, "p_version" character varying, "p_updated_by" character varying, "p_content_value" "text", "p_content_json" "jsonb", "p_file_url" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO page_content (
        page_name,
        content_key,
        content_type,
        content_value,
        content_json,
        file_url,
        version,
        updated_by,
        updated_at,
        is_active
    ) VALUES (
        p_page_name,
        p_content_key,
        p_content_type,
        p_content_value,
        p_content_json,
        p_file_url,
        p_version,
        p_updated_by,
        NOW(),
        TRUE
    )
    ON CONFLICT (page_name, content_key) 
    DO UPDATE SET
        content_type = EXCLUDED.content_type,
        content_value = EXCLUDED.content_value,
        content_json = EXCLUDED.content_json,
        file_url = EXCLUDED.file_url,
        version = EXCLUDED.version,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."simple_upsert_content"("p_page_name" character varying, "p_content_key" character varying, "p_content_type" character varying, "p_version" character varying, "p_updated_by" character varying, "p_content_value" "text", "p_content_json" "jsonb", "p_file_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_media_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_media_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_page_content_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_page_content_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_quota_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_quota_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_seo_pages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_seo_pages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_quota"("p_user_id" "uuid", "p_hours_change" numeric, "p_transaction_type" character varying, "p_description" "text", "p_amount_paid" numeric DEFAULT NULL::numeric, "p_package_id" "uuid" DEFAULT NULL::"uuid", "p_booking_id" "uuid" DEFAULT NULL::"uuid", "p_payment_id" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_transaction_id UUID;
    v_current_quota user_quotas%ROWTYPE;
BEGIN
    -- Get or create user quota record
    INSERT INTO user_quotas (user_id, total_hours, used_hours)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current quota
    SELECT * INTO v_current_quota FROM user_quotas WHERE user_id = p_user_id;
    
    -- Validate the transaction
    IF p_transaction_type = 'booking' AND p_hours_change < 0 THEN
        IF (v_current_quota.available_hours + p_hours_change) < 0 THEN
            RAISE EXCEPTION 'Insufficient quota hours. Available: %, Requested: %', 
                v_current_quota.available_hours, ABS(p_hours_change);
        END IF;
    END IF;
    
    -- Create transaction record
    INSERT INTO quota_transactions (
        user_id, transaction_type, hours_change, amount_paid, description,
        package_id, booking_id, payment_id, metadata
    ) VALUES (
        p_user_id, p_transaction_type, p_hours_change, p_amount_paid, p_description,
        p_package_id, p_booking_id, p_payment_id, p_metadata
    ) RETURNING id INTO v_transaction_id;
    
    -- Update user quota
    IF p_transaction_type IN ('purchase', 'refund', 'adjustment', 'free_credit') THEN
        -- These affect total_hours
        UPDATE user_quotas 
        SET total_hours = total_hours + p_hours_change
        WHERE user_id = p_user_id;
    ELSIF p_transaction_type = 'booking' THEN
        -- This affects used_hours
        UPDATE user_quotas 
        SET used_hours = used_hours + ABS(p_hours_change)
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN v_transaction_id;
END;
$$;


ALTER FUNCTION "public"."update_user_quota"("p_user_id" "uuid", "p_hours_change" numeric, "p_transaction_type" character varying, "p_description" "text", "p_amount_paid" numeric, "p_package_id" "uuid", "p_booking_id" "uuid", "p_payment_id" "text", "p_metadata" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "package_id" "uuid",
    "date" "date" NOT NULL,
    "time" time without time zone NOT NULL,
    "status" "text" NOT NULL,
    "payment_id" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "google_calendar_event_id" "text",
    "hours_used" numeric(5,2) DEFAULT 1.00,
    "quota_transaction_id" "uuid",
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."component_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "category" character varying(100) DEFAULT 'content'::character varying NOT NULL,
    "icon" character varying(100),
    "description" "text",
    "template" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "preview_image" "text",
    "is_system" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "protect_system_components" CHECK ((("is_system" = false) OR ("id" IS NOT NULL)))
);


ALTER TABLE "public"."component_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_name" character varying(100) NOT NULL,
    "content_key" character varying(255) NOT NULL,
    "content_type" character varying(20) NOT NULL,
    "content_value" "text",
    "content_json" "jsonb",
    "file_url" "text",
    "alt_text" "text",
    "version" character varying(50) NOT NULL,
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" character varying(255) NOT NULL,
    "change_description" "text",
    CONSTRAINT "content_versions_content_type_check" CHECK ((("content_type")::"text" = ANY ((ARRAY['text'::character varying, 'json'::character varying, 'file'::character varying, 'boolean'::character varying])::"text"[])))
);


ALTER TABLE "public"."content_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_name" character varying(100) NOT NULL,
    "content_key" character varying(200) NOT NULL,
    "content_value" "text",
    "content_json" "jsonb",
    "content_type" character varying(20) DEFAULT 'text'::character varying,
    "file_url" "text",
    "alt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    "updated_by" "text",
    "version" character varying(50),
    "last_conflict_at" timestamp with time zone,
    CONSTRAINT "page_content_content_type_check" CHECK ((("content_type")::"text" = ANY ((ARRAY['text'::character varying, 'json'::character varying, 'file'::character varying])::"text"[])))
);


ALTER TABLE "public"."page_content" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."content_history" AS
 SELECT "cv"."id",
    "cv"."page_name",
    "cv"."content_key",
    "cv"."content_type",
    "cv"."content_value",
    "cv"."content_json",
    "cv"."file_url",
    "cv"."version",
    "cv"."created_at",
    "cv"."created_by",
    "cv"."change_description",
    "pc"."version" AS "current_version",
        CASE
            WHEN (("cv"."version")::"text" = ("pc"."version")::"text") THEN true
            ELSE false
        END AS "is_current"
   FROM ("public"."content_versions" "cv"
     LEFT JOIN "public"."page_content" "pc" ON (((("cv"."page_name")::"text" = ("pc"."page_name")::"text") AND (("cv"."content_key")::"text" = ("pc"."content_key")::"text"))))
  ORDER BY "cv"."created_at" DESC;


ALTER VIEW "public"."content_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_fingerprints" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "fingerprint_hash" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "screen_resolution" "text",
    "timezone" "text",
    "language" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_seen_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_fingerprints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subject" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "user_email" character varying(255) NOT NULL,
    "user_name" character varying(255) NOT NULL,
    "status" character varying(20) DEFAULT 'sent'::character varying,
    "email_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "instructor_messages_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['sent'::character varying, 'delivered'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."instructor_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."invitation_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "original_name" character varying(255) NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "storage_path" character varying(500) NOT NULL,
    "public_url" "text" NOT NULL,
    "file_type" character varying(20) NOT NULL,
    "mime_type" character varying(100) NOT NULL,
    "file_size" bigint NOT NULL,
    "width" integer,
    "height" integer,
    "duration" double precision,
    "alt_text" "text",
    "caption" "text",
    "description" "text",
    "folder_id" "uuid",
    "tags" "text"[],
    "content_key" character varying(255),
    "page_name" character varying(100),
    "uploaded_by" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "media_files_file_type_check" CHECK ((("file_type")::"text" = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'audio'::character varying, 'document'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."media_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "created_by" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_folders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."media_files_with_folders" AS
 SELECT "mf"."id",
    "mf"."original_name",
    "mf"."file_name",
    "mf"."storage_path",
    "mf"."public_url",
    "mf"."file_type",
    "mf"."mime_type",
    "mf"."file_size",
    "mf"."width",
    "mf"."height",
    "mf"."duration",
    "mf"."alt_text",
    "mf"."caption",
    "mf"."description",
    "mf"."folder_id",
    "mf"."tags",
    "mf"."content_key",
    "mf"."page_name",
    "mf"."uploaded_by",
    "mf"."created_at",
    "mf"."updated_at",
    "mf"."deleted_at",
    "mf"."is_active",
    COALESCE("folder"."name", 'Root'::character varying) AS "folder_name",
    COALESCE("folder"."slug", ''::character varying) AS "folder_slug"
   FROM ("public"."media_files" "mf"
     LEFT JOIN "public"."media_folders" "folder" ON (("mf"."folder_id" = "folder"."id")))
  WHERE ("mf"."is_active" = true);


ALTER VIEW "public"."media_files_with_folders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."media_folder_stats" AS
 SELECT "f"."id",
    "f"."name",
    "f"."slug",
    "f"."description",
    "f"."parent_id",
    "f"."created_by",
    "f"."created_at",
    "f"."updated_at",
    COALESCE("file_counts"."direct_count", (0)::bigint) AS "direct_file_count",
    COALESCE("file_counts"."direct_count", (0)::bigint) AS "total_file_count"
   FROM ("public"."media_folders" "f"
     LEFT JOIN ( SELECT "media_files"."folder_id",
            "count"(*) AS "direct_count"
           FROM "public"."media_files"
          WHERE ("media_files"."is_active" = true)
          GROUP BY "media_files"."folder_id") "file_counts" ON (("f"."id" = "file_counts"."folder_id")));


ALTER VIEW "public"."media_folder_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."packages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "hours" integer NOT NULL,
    "features" "jsonb" NOT NULL,
    "popular" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_revisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_id" "uuid" NOT NULL,
    "content" "jsonb" NOT NULL,
    "meta_data" "jsonb" NOT NULL,
    "settings" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "author_id" "text",
    "revision_note" "text"
);


ALTER TABLE "public"."page_revisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "content" "jsonb" DEFAULT '{"blocks": []}'::"jsonb" NOT NULL,
    "meta_data" "jsonb" DEFAULT '{"keywords": "", "og_image": "", "og_title": "", "description": "", "og_description": ""}'::"jsonb",
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "settings" "jsonb" DEFAULT '{"layout": "default", "show_footer": true, "show_header": true, "allow_comments": false}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "author_id" "text",
    CONSTRAINT "pages_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::"text"[]))),
    CONSTRAINT "valid_slug" CHECK ((("slug")::"text" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::"text"))
);


ALTER TABLE "public"."pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quota_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_type" character varying(20) NOT NULL,
    "hours_change" numeric(5,2) NOT NULL,
    "amount_paid" numeric(10,2),
    "description" "text" NOT NULL,
    "package_id" "uuid",
    "booking_id" "uuid",
    "payment_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "quota_transactions_transaction_type_check" CHECK ((("transaction_type")::"text" = ANY ((ARRAY['purchase'::character varying, 'booking'::character varying, 'refund'::character varying, 'adjustment'::character varying, 'free_credit'::character varying])::"text"[])))
);


ALTER TABLE "public"."quota_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "invitation_code" "text" NOT NULL,
    "referred_user_id" "uuid",
    "device_fingerprint" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "status" "text" DEFAULT 'attempted'::"text" NOT NULL,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referral_attempts_status_check" CHECK (("status" = ANY (ARRAY['attempted'::"text", 'successful'::"text", 'failed'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."referral_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_rewards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "referral_id" "uuid" NOT NULL,
    "reward_type" "text" NOT NULL,
    "reward_value" numeric(10,2),
    "applied_to_booking_id" "uuid",
    "applied_to_transaction_id" "uuid",
    "is_used" boolean DEFAULT false,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '1 year'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "used_at" timestamp with time zone,
    CONSTRAINT "referral_rewards_reward_type_check" CHECK (("reward_type" = ANY (ARRAY['discount_30_percent'::"text", 'free_hours_2'::"text"])))
);


ALTER TABLE "public"."referral_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "referrer_user_id" "uuid" NOT NULL,
    "referred_user_id" "uuid" NOT NULL,
    "invitation_code_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "reward_tier" integer DEFAULT 0,
    "reward_applied" boolean DEFAULT false,
    "device_fingerprint" "text",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "no_self_referral" CHECK (("referrer_user_id" <> "referred_user_id")),
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "text",
    "rating" integer NOT NULL,
    "comment" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "approved" boolean DEFAULT false,
    "user_name" "text" NOT NULL,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_url" character varying(500) NOT NULL,
    "title" character varying(255),
    "description" "text",
    "keywords" "text",
    "og_title" character varying(255),
    "og_description" "text",
    "og_image" character varying(500),
    "twitter_title" character varying(255),
    "twitter_description" "text",
    "twitter_image" character varying(500),
    "canonical_url" character varying(500),
    "robots" character varying(100) DEFAULT 'index, follow'::character varying,
    "schema_markup" "jsonb",
    "is_active" boolean DEFAULT true,
    "updated_by" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seo_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" character varying(255) NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "updated_by" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suspicious_activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "activity_type" "text" NOT NULL,
    "user_id" "uuid",
    "ip_address" "inet",
    "device_fingerprint" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "severity" "text" DEFAULT 'medium'::"text",
    "is_resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "suspicious_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['multiple_accounts_same_device'::"text", 'too_many_attempts'::"text", 'suspicious_pattern'::"text", 'blocked_referral'::"text"]))),
    CONSTRAINT "suspicious_activities_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."suspicious_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    CONSTRAINT "user_notifications_type_check" CHECK (("type" = ANY (ARRAY['referral_success'::"text", 'reward_earned'::"text", 'system'::"text", 'reminder'::"text"])))
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_quotas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_hours" numeric(5,2) DEFAULT 0.00 NOT NULL,
    "used_hours" numeric(5,2) DEFAULT 0.00 NOT NULL,
    "available_hours" numeric(5,2) GENERATED ALWAYS AS (("total_hours" - "used_hours")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_hours" CHECK ((("used_hours" <= "total_hours") AND ("used_hours" >= (0)::numeric) AND ("total_hours" >= (0)::numeric)))
);


ALTER TABLE "public"."user_quotas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "clerk_id" "text" NOT NULL,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "address" "text",
    "invitation_code" "text",
    "location" "text",
    "completed_onboarding" boolean DEFAULT false
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."component_templates"
    ADD CONSTRAINT "component_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_versions"
    ADD CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_fingerprints"
    ADD CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_messages"
    ADD CONSTRAINT "instructor_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_files"
    ADD CONSTRAINT "media_files_file_name_key" UNIQUE ("file_name");



ALTER TABLE ONLY "public"."media_files"
    ADD CONSTRAINT "media_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_files"
    ADD CONSTRAINT "media_files_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "media_folders_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_content"
    ADD CONSTRAINT "page_content_page_name_content_key_key" UNIQUE ("page_name", "content_key");



ALTER TABLE ONLY "public"."page_content"
    ADD CONSTRAINT "page_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_revisions"
    ADD CONSTRAINT "page_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."quota_transactions"
    ADD CONSTRAINT "quota_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_attempts"
    ADD CONSTRAINT "referral_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_pages"
    ADD CONSTRAINT "seo_pages_page_url_key" UNIQUE ("page_url");



ALTER TABLE ONLY "public"."seo_pages"
    ADD CONSTRAINT "seo_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."suspicious_activities"
    ADD CONSTRAINT "suspicious_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "unique_active_user_invitation" UNIQUE ("user_id", "is_active") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "unique_folder_name_per_parent" UNIQUE ("name", "parent_id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "unique_referral" UNIQUE ("referred_user_id");



ALTER TABLE ONLY "public"."device_fingerprints"
    ADD CONSTRAINT "unique_user_fingerprint" UNIQUE ("user_id", "fingerprint_hash");



ALTER TABLE ONLY "public"."user_quotas"
    ADD CONSTRAINT "unique_user_quota" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_quotas"
    ADD CONSTRAINT "user_quotas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_clerk_id_key" UNIQUE ("clerk_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_bookings_date" ON "public"."bookings" USING "btree" ("date");



CREATE INDEX "idx_bookings_package_id" ON "public"."bookings" USING "btree" ("package_id");



CREATE INDEX "idx_bookings_quota_transaction" ON "public"."bookings" USING "btree" ("quota_transaction_id");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_user_id" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_component_templates_category" ON "public"."component_templates" USING "btree" ("category");



CREATE INDEX "idx_content_versions_created" ON "public"."content_versions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_content_versions_page_key" ON "public"."content_versions" USING "btree" ("page_name", "content_key");



CREATE INDEX "idx_content_versions_user" ON "public"."content_versions" USING "btree" ("created_by");



CREATE INDEX "idx_content_versions_version" ON "public"."content_versions" USING "btree" ("version");



CREATE INDEX "idx_device_fingerprints_hash" ON "public"."device_fingerprints" USING "btree" ("fingerprint_hash");



CREATE INDEX "idx_instructor_messages_user_id" ON "public"."instructor_messages" USING "btree" ("user_id");



CREATE INDEX "idx_invitation_codes_code" ON "public"."invitation_codes" USING "btree" ("code");



CREATE INDEX "idx_invitation_codes_user_id" ON "public"."invitation_codes" USING "btree" ("user_id");



CREATE INDEX "idx_media_files_active" ON "public"."media_files" USING "btree" ("is_active");



CREATE INDEX "idx_media_files_alt_search" ON "public"."media_files" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("alt_text", ''::"text")));



CREATE INDEX "idx_media_files_content_key" ON "public"."media_files" USING "btree" ("content_key");



CREATE INDEX "idx_media_files_created_at" ON "public"."media_files" USING "btree" ("created_at");



CREATE INDEX "idx_media_files_desc_search" ON "public"."media_files" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("description", ''::"text")));



CREATE INDEX "idx_media_files_folder" ON "public"."media_files" USING "btree" ("folder_id");



CREATE INDEX "idx_media_files_name_search" ON "public"."media_files" USING "gin" ("to_tsvector"('"english"'::"regconfig", ("original_name")::"text"));



CREATE INDEX "idx_media_files_page_name" ON "public"."media_files" USING "btree" ("page_name");



CREATE INDEX "idx_media_files_tags" ON "public"."media_files" USING "gin" ("tags");



CREATE INDEX "idx_media_files_type" ON "public"."media_files" USING "btree" ("file_type");



CREATE INDEX "idx_media_files_uploaded_by" ON "public"."media_files" USING "btree" ("uploaded_by");



CREATE INDEX "idx_media_folders_parent" ON "public"."media_folders" USING "btree" ("parent_id");



CREATE INDEX "idx_media_folders_slug" ON "public"."media_folders" USING "btree" ("slug");



CREATE INDEX "idx_page_content_key" ON "public"."page_content" USING "btree" ("content_key");



CREATE INDEX "idx_page_content_page" ON "public"."page_content" USING "btree" ("page_name");



CREATE INDEX "idx_page_content_page_name" ON "public"."page_content" USING "btree" ("page_name");



CREATE INDEX "idx_page_content_type" ON "public"."page_content" USING "btree" ("content_type");



CREATE INDEX "idx_page_content_updated" ON "public"."page_content" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_page_revisions_page_id" ON "public"."page_revisions" USING "btree" ("page_id");



CREATE INDEX "idx_pages_slug" ON "public"."pages" USING "btree" ("slug");



CREATE INDEX "idx_pages_status" ON "public"."pages" USING "btree" ("status");



CREATE INDEX "idx_pages_updated_at" ON "public"."pages" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_quota_transactions_created_at" ON "public"."quota_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_quota_transactions_type" ON "public"."quota_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_quota_transactions_user_id" ON "public"."quota_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_referral_attempts_code" ON "public"."referral_attempts" USING "btree" ("invitation_code", "created_at");



CREATE INDEX "idx_referral_attempts_ip" ON "public"."referral_attempts" USING "btree" ("ip_address", "created_at");



CREATE INDEX "idx_referral_attempts_ip_fingerprint" ON "public"."referral_attempts" USING "btree" ("ip_address", "device_fingerprint", "created_at");



CREATE INDEX "idx_referral_attempts_user" ON "public"."referral_attempts" USING "btree" ("referred_user_id", "created_at");



CREATE INDEX "idx_referral_rewards_unused" ON "public"."referral_rewards" USING "btree" ("user_id", "is_used") WHERE ("is_used" = false);



CREATE INDEX "idx_referral_rewards_user_id" ON "public"."referral_rewards" USING "btree" ("user_id");



CREATE INDEX "idx_referrals_referred" ON "public"."referrals" USING "btree" ("referred_user_id");



CREATE INDEX "idx_referrals_referrer" ON "public"."referrals" USING "btree" ("referrer_user_id");



CREATE INDEX "idx_reviews_approved" ON "public"."reviews" USING "btree" ("approved");



CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_seo_pages_active" ON "public"."seo_pages" USING "btree" ("is_active");



CREATE INDEX "idx_seo_pages_url" ON "public"."seo_pages" USING "btree" ("page_url");



CREATE INDEX "idx_site_settings_key" ON "public"."site_settings" USING "btree" ("setting_key");



CREATE INDEX "idx_suspicious_activities_unresolved" ON "public"."suspicious_activities" USING "btree" ("is_resolved", "severity", "created_at") WHERE ("is_resolved" = false);



CREATE INDEX "idx_suspicious_activities_user" ON "public"."suspicious_activities" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_user_notifications_created_at" ON "public"."user_notifications" USING "btree" ("created_at");



CREATE INDEX "idx_user_notifications_unread" ON "public"."user_notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_user_notifications_user_id" ON "public"."user_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_user_quotas_user_id" ON "public"."user_quotas" USING "btree" ("user_id");



CREATE INDEX "idx_users_clerk_id" ON "public"."users" USING "btree" ("clerk_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE OR REPLACE TRIGGER "trigger_create_content_version" BEFORE UPDATE ON "public"."page_content" FOR EACH ROW EXECUTE FUNCTION "public"."create_content_version"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_media_files_updated_at" BEFORE UPDATE ON "public"."media_files" FOR EACH ROW EXECUTE FUNCTION "public"."update_media_updated_at"();



CREATE OR REPLACE TRIGGER "update_media_folders_updated_at" BEFORE UPDATE ON "public"."media_folders" FOR EACH ROW EXECUTE FUNCTION "public"."update_media_updated_at"();



CREATE OR REPLACE TRIGGER "update_packages_updated_at" BEFORE UPDATE ON "public"."packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_page_content_updated_at" BEFORE UPDATE ON "public"."page_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_page_content_updated_at"();



CREATE OR REPLACE TRIGGER "update_pages_updated_at" BEFORE UPDATE ON "public"."pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_seo_pages_updated_at" BEFORE UPDATE ON "public"."seo_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_seo_pages_updated_at"();



CREATE OR REPLACE TRIGGER "update_site_settings_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_quotas_updated_at" BEFORE UPDATE ON "public"."user_quotas" FOR EACH ROW EXECUTE FUNCTION "public"."update_quota_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_quota_transaction_id_fkey" FOREIGN KEY ("quota_transaction_id") REFERENCES "public"."quota_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_fingerprints"
    ADD CONSTRAINT "device_fingerprints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor_messages"
    ADD CONSTRAINT "instructor_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_files"
    ADD CONSTRAINT "media_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."media_folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."page_revisions"
    ADD CONSTRAINT "page_revisions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quota_transactions"
    ADD CONSTRAINT "quota_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quota_transactions"
    ADD CONSTRAINT "quota_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quota_transactions"
    ADD CONSTRAINT "quota_transactions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quota_transactions"
    ADD CONSTRAINT "quota_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_attempts"
    ADD CONSTRAINT "referral_attempts_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_applied_to_booking_id_fkey" FOREIGN KEY ("applied_to_booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_applied_to_transaction_id_fkey" FOREIGN KEY ("applied_to_transaction_id") REFERENCES "public"."quota_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_invitation_code_id_fkey" FOREIGN KEY ("invitation_code_id") REFERENCES "public"."invitation_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suspicious_activities"
    ADD CONSTRAINT "suspicious_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quotas"
    ADD CONSTRAINT "user_quotas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all quotas" ON "public"."user_quotas" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage all transactions" ON "public"."quota_transactions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage device fingerprints" ON "public"."device_fingerprints" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage invitation codes" ON "public"."invitation_codes" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage notifications" ON "public"."user_notifications" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage referrals" ON "public"."referrals" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage rewards" ON "public"."referral_rewards" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can view all messages" ON "public"."instructor_messages" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can view suspicious activities" ON "public"."suspicious_activities" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow service role to manage content_versions" ON "public"."content_versions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage page_content" ON "public"."page_content" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow users to read content_versions" ON "public"."content_versions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Anyone can view packages" ON "public"."packages" FOR SELECT USING (true);



CREATE POLICY "Service role can manage bookings" ON "public"."bookings" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage packages" ON "public"."packages" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage users" ON "public"."users" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can create own bookings" ON "public"."bookings" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "bookings"."user_id"))));



CREATE POLICY "Users can create own messages" ON "public"."instructor_messages" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "instructor_messages"."user_id"))));



CREATE POLICY "Users can update own data" ON "public"."users" FOR UPDATE USING ((("auth"."uid"())::"text" = "clerk_id"));



CREATE POLICY "Users can update own notifications" ON "public"."user_notifications" FOR UPDATE USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "user_notifications"."user_id"))));



CREATE POLICY "Users can view own bookings" ON "public"."bookings" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "bookings"."user_id"))));



CREATE POLICY "Users can view own data" ON "public"."users" FOR SELECT USING ((("auth"."uid"())::"text" = "clerk_id"));



CREATE POLICY "Users can view own device fingerprints" ON "public"."device_fingerprints" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "device_fingerprints"."user_id"))));



CREATE POLICY "Users can view own invitation codes" ON "public"."invitation_codes" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "invitation_codes"."user_id"))));



CREATE POLICY "Users can view own messages" ON "public"."instructor_messages" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "instructor_messages"."user_id"))));



CREATE POLICY "Users can view own notifications" ON "public"."user_notifications" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "user_notifications"."user_id"))));



CREATE POLICY "Users can view own quota" ON "public"."user_quotas" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "user_quotas"."user_id"))));



CREATE POLICY "Users can view own referral attempts" ON "public"."referral_attempts" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "referral_attempts"."referred_user_id"))));



CREATE POLICY "Users can view own referrals" ON "public"."referrals" FOR SELECT USING (((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "referrals"."referrer_user_id"))) OR (("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "referrals"."referred_user_id")))));



CREATE POLICY "Users can view own rewards" ON "public"."referral_rewards" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "referral_rewards"."user_id"))));



CREATE POLICY "Users can view own transactions" ON "public"."quota_transactions" FOR SELECT USING ((("auth"."uid"())::"text" = ( SELECT "users"."clerk_id"
   FROM "public"."users"
  WHERE ("users"."id" = "quota_transactions"."user_id"))));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_fingerprints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructor_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitation_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quota_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suspicious_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_quotas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_action" "text", "p_limit" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_action" "text", "p_limit" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_action" "text", "p_limit" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_versions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_versions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_versions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_media"("dry_run" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_media"("dry_run" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_media"("dry_run" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_folder_files"("folder_uuid" "uuid", "include_subfolders" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."count_folder_files"("folder_uuid" "uuid", "include_subfolders" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_folder_files"("folder_uuid" "uuid", "include_subfolders" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_content_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_content_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_content_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_invitation_code"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_invitation_code"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_invitation_code"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_content_conflict"("p_page_name" character varying, "p_content_key" character varying, "p_expected_version" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."detect_content_conflict"("p_page_name" character varying, "p_content_key" character varying, "p_expected_version" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_content_conflict"("p_page_name" character varying, "p_content_key" character varying, "p_expected_version" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_referral_fraud"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."detect_referral_fraud"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_referral_fraud"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_storage_path"("file_type" "text", "file_extension" "text", "subfolder" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_storage_path"("file_type" "text", "file_extension" "text", "subfolder" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_storage_path"("file_type" "text", "file_extension" "text", "subfolder" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_content_by_section"("section_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_content_by_section"("section_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_content_by_section"("section_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_folder_path"("folder_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_folder_path"("folder_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_folder_path"("folder_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_storage_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_storage_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_storage_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("user_clerk_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("user_clerk_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("user_clerk_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_content_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_content_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_content_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("notification_id" "uuid", "user_clerk_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("notification_id" "uuid", "user_clerk_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("notification_id" "uuid", "user_clerk_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_referral"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."process_referral"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_referral"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_referral_secure"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_referral_secure"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_referral_secure"("p_referred_user_id" "uuid", "p_invitation_code" "text", "p_device_fingerprint" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_media_files"("search_term" "text", "file_types" "text"[], "folder_uuid" "uuid", "include_subfolders" boolean, "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_media_files"("search_term" "text", "file_types" "text"[], "folder_uuid" "uuid", "include_subfolders" boolean, "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_media_files"("search_term" "text", "file_types" "text"[], "folder_uuid" "uuid", "include_subfolders" boolean, "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."simple_upsert_content"("p_page_name" character varying, "p_content_key" character varying, "p_content_type" character varying, "p_version" character varying, "p_updated_by" character varying, "p_content_value" "text", "p_content_json" "jsonb", "p_file_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."simple_upsert_content"("p_page_name" character varying, "p_content_key" character varying, "p_content_type" character varying, "p_version" character varying, "p_updated_by" character varying, "p_content_value" "text", "p_content_json" "jsonb", "p_file_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."simple_upsert_content"("p_page_name" character varying, "p_content_key" character varying, "p_content_type" character varying, "p_version" character varying, "p_updated_by" character varying, "p_content_value" "text", "p_content_json" "jsonb", "p_file_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_media_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_media_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_media_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_page_content_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_page_content_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_page_content_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quota_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_quota_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quota_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_seo_pages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_seo_pages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_seo_pages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_quota"("p_user_id" "uuid", "p_hours_change" numeric, "p_transaction_type" character varying, "p_description" "text", "p_amount_paid" numeric, "p_package_id" "uuid", "p_booking_id" "uuid", "p_payment_id" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_quota"("p_user_id" "uuid", "p_hours_change" numeric, "p_transaction_type" character varying, "p_description" "text", "p_amount_paid" numeric, "p_package_id" "uuid", "p_booking_id" "uuid", "p_payment_id" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_quota"("p_user_id" "uuid", "p_hours_change" numeric, "p_transaction_type" character varying, "p_description" "text", "p_amount_paid" numeric, "p_package_id" "uuid", "p_booking_id" "uuid", "p_payment_id" "text", "p_metadata" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."component_templates" TO "anon";
GRANT ALL ON TABLE "public"."component_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."component_templates" TO "service_role";



GRANT ALL ON TABLE "public"."content_versions" TO "anon";
GRANT ALL ON TABLE "public"."content_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."content_versions" TO "service_role";



GRANT ALL ON TABLE "public"."page_content" TO "anon";
GRANT ALL ON TABLE "public"."page_content" TO "authenticated";
GRANT ALL ON TABLE "public"."page_content" TO "service_role";



GRANT ALL ON TABLE "public"."content_history" TO "anon";
GRANT ALL ON TABLE "public"."content_history" TO "authenticated";
GRANT ALL ON TABLE "public"."content_history" TO "service_role";



GRANT ALL ON TABLE "public"."device_fingerprints" TO "anon";
GRANT ALL ON TABLE "public"."device_fingerprints" TO "authenticated";
GRANT ALL ON TABLE "public"."device_fingerprints" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_messages" TO "anon";
GRANT ALL ON TABLE "public"."instructor_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_messages" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_codes" TO "anon";
GRANT ALL ON TABLE "public"."invitation_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_codes" TO "service_role";



GRANT ALL ON TABLE "public"."media_files" TO "anon";
GRANT ALL ON TABLE "public"."media_files" TO "authenticated";
GRANT ALL ON TABLE "public"."media_files" TO "service_role";



GRANT ALL ON TABLE "public"."media_folders" TO "anon";
GRANT ALL ON TABLE "public"."media_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."media_folders" TO "service_role";



GRANT ALL ON TABLE "public"."media_files_with_folders" TO "anon";
GRANT ALL ON TABLE "public"."media_files_with_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."media_files_with_folders" TO "service_role";



GRANT ALL ON TABLE "public"."media_folder_stats" TO "anon";
GRANT ALL ON TABLE "public"."media_folder_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."media_folder_stats" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."page_revisions" TO "anon";
GRANT ALL ON TABLE "public"."page_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."page_revisions" TO "service_role";



GRANT ALL ON TABLE "public"."pages" TO "anon";
GRANT ALL ON TABLE "public"."pages" TO "authenticated";
GRANT ALL ON TABLE "public"."pages" TO "service_role";



GRANT ALL ON TABLE "public"."quota_transactions" TO "anon";
GRANT ALL ON TABLE "public"."quota_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."quota_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."referral_attempts" TO "anon";
GRANT ALL ON TABLE "public"."referral_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."referral_rewards" TO "anon";
GRANT ALL ON TABLE "public"."referral_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."seo_pages" TO "anon";
GRANT ALL ON TABLE "public"."seo_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_pages" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."suspicious_activities" TO "anon";
GRANT ALL ON TABLE "public"."suspicious_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."suspicious_activities" TO "service_role";



GRANT ALL ON TABLE "public"."user_notifications" TO "anon";
GRANT ALL ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_quotas" TO "anon";
GRANT ALL ON TABLE "public"."user_quotas" TO "authenticated";
GRANT ALL ON TABLE "public"."user_quotas" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
