import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Interface definitions
interface MediaFile {
  id: string;
  original_name: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | 'other';
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  duration?: number;
  alt_text?: string;
  caption?: string;
  description?: string;
  folder_id?: string;
  folder_name?: string;
  folder_path?: string;
  tags?: string[];
  content_key?: string;
  page_name?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  folder_path?: string;
  direct_file_count: number;
  total_file_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId);
    return user.publicMetadata?.role === 'admin' || process.env.NODE_ENV === 'development';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/')) return 'document';
  return 'other';
}

// GET - Retrieve media files and folders
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'files'; // 'files' | 'folders' | 'search'
    const folderId = searchParams.get('folder');
    const search = searchParams.get('search') || '';
    const fileTypes = searchParams.get('fileTypes')?.split(',') || ['image', 'video', 'audio', 'document', 'other'];
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeSubfolders = searchParams.get('includeSubfolders') === 'true';

    if (type === 'folders') {
      // Get folders with statistics
      const { data: folders, error } = await supabase
        .from('media_folder_stats')
        .select('*')
        .order('name');

      if (error) {
        console.error('Failed to fetch folders:', error);
        return NextResponse.json({ error: 'Failed to fetch folders', details: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: folders || [] });
    }

    if (type === 'search' || search) {
      // Use the search function
      const { data: files, error } = await supabase
        .rpc('search_media_files', {
          search_term: search,
          file_types: fileTypes,
          folder_uuid: folderId || null,
          include_subfolders: includeSubfolders,
          limit_count: limit,
          offset_count: offset
        });

      if (error) {
        console.error('Failed to search media files:', error);
        return NextResponse.json({ error: 'Failed to search media files', details: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: files || [] });
    }

    // Get files with folder information
    let query = supabase
      .from('media_files_with_folders')
      .select('*');

    // Filter by folder if specified
    if (folderId) {
      if (includeSubfolders) {
        // Get all files in folder and subfolders
        const { data: folderPath } = await supabase
          .rpc('get_folder_path', { folder_uuid: folderId });
        
        query = query.or(`folder_id.eq.${folderId},full_folder_path.like.${folderPath}%`);
      } else {
        query = query.eq('folder_id', folderId);
      }
    } else if (folderId === null || folderId === '') {
      // Root folder only
      query = query.is('folder_id', null);
    }

    // Filter by file types
    if (fileTypes.length > 0 && !fileTypes.includes('all')) {
      query = query.in('file_type', fileTypes);
    }

    // Add pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: files, error } = await query;

    if (error) {
      console.error('Failed to fetch media files:', error);
      return NextResponse.json({ error: 'Failed to fetch media files', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: files || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Upload new files or create folders
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const folderId = formData.get('folderId') as string || null;
      const tags = (formData.get('tags') as string || '').split(',').filter(tag => tag.trim());

      if (files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }

      const supabase = await createServerComponentClient({ cookies });
      const uploadedFiles: MediaFile[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          // Validate file
          const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif',
            'video/mp4', 'video/webm', 'video/quicktime',
            'audio/mp3', 'audio/wav', 'audio/ogg',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];

          if (!allowedTypes.includes(file.type)) {
            errors.push(`${file.name}: Unsupported file type`);
            continue;
          }

          const maxSize = 100 * 1024 * 1024; // 100MB
          if (file.size > maxSize) {
            errors.push(`${file.name}: File too large (max 100MB)`);
            continue;
          }

          // Generate unique filename
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          const fileName = `${Date.now()}_${uuidv4()}.${fileExtension}`;
          const filePath = `media-library/${fileName}`;

          // Upload to Supabase Storage
          const arrayBuffer = await file.arrayBuffer();
          const fileBuffer = new Uint8Array(arrayBuffer);

          const { error: uploadError } = await supabase.storage
            .from('site-content')
            .upload(filePath, fileBuffer, {
              contentType: file.type,
              duplex: 'half',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            errors.push(`${file.name}: Upload failed`);
            continue;
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('site-content')
            .getPublicUrl(filePath);

          // Get file dimensions for images
          let width: number | undefined;
          let height: number | undefined;

          if (file.type.startsWith('image/')) {
            try {
              // For images, we'll need to implement dimension detection
              // For now, we'll leave it undefined and can be updated later
            } catch (e) {
              // Ignore dimension detection errors
            }
          }

          // Save to database
          const mediaFile = {
            original_name: file.name,
            file_name: fileName,
            storage_path: filePath,
            public_url: publicUrlData.publicUrl,
            file_type: getFileType(file.type),
            mime_type: file.type,
            file_size: file.size,
            width,
            height,
            alt_text: `${file.name.replace(/\.[^/.]+$/, '')}`, // Remove extension for default alt
            folder_id: folderId,
            tags: tags.length > 0 ? tags : null,
            uploaded_by: userId
          };

          const { data: savedFile, error: saveError } = await supabase
            .from('media_files')
            .insert(mediaFile)
            .select('*, folder_name:media_folders(name)')
            .single();

          if (saveError) {
            console.error('Save error:', saveError);
            errors.push(`${file.name}: Failed to save metadata`);
            continue;
          }

          uploadedFiles.push(savedFile as MediaFile);

        } catch (error) {
          console.error('File processing error:', error);
          errors.push(`${file.name}: Processing failed`);
        }
      }

      return NextResponse.json({
        success: true,
        data: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
        message: `Uploaded ${uploadedFiles.length} file(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`
      });

    } else {
      // Create folder
      const body = await request.json();
      const { name, description, parentId } = body;

      if (!name?.trim()) {
        return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
      }

      const slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const supabase = createServerComponentClient({ cookies });

      const folderData = {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        parent_id: parentId || null,
        created_by: userId
      };

      const { data: folder, error } = await supabase
        .from('media_folders')
        .insert(folderData)
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return NextResponse.json({ error: 'Folder name already exists' }, { status: 400 });
        }
        console.error('Failed to create folder:', error);
        return NextResponse.json({ error: 'Failed to create folder', details: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: folder,
        message: `Folder "${name}" created successfully`
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update file or folder metadata
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    if (!type || !id || !data) {
      return NextResponse.json({ error: 'Type, ID, and data are required' }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    if (type === 'file') {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: updatedFile, error } = await supabase
        .from('media_files')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to update file:', error);
        return NextResponse.json({ error: 'Failed to update file', details: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: updatedFile,
        message: 'File updated successfully'
      });

    } else if (type === 'folder') {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: updatedFolder, error } = await supabase
        .from('media_folders')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to update folder:', error);
        return NextResponse.json({ error: 'Failed to update folder', details: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: updatedFolder,
        message: 'Folder updated successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid type specified' }, { status: 400 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove files or folders
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const force = searchParams.get('force') === 'true';

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required' }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    if (type === 'file') {
      // Get file info first
      const { data: file, error: fetchError } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      if (force) {
        // Hard delete - remove from storage and database
        const { error: storageError } = await supabase.storage
          .from('site-content')
          .remove([file.storage_path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }

        const { error: dbError } = await supabase
          .from('media_files')
          .delete()
          .eq('id', id);

        if (dbError) {
          console.error('Database deletion error:', dbError);
          return NextResponse.json({ error: 'Failed to delete file', details: dbError.message }, { status: 500 });
        }
      } else {
        // Soft delete
        const { error } = await supabase
          .from('media_files')
          .update({ 
            is_active: false, 
            deleted_at: new Date().toISOString() 
          })
          .eq('id', id);

        if (error) {
          console.error('Failed to delete file:', error);
          return NextResponse.json({ error: 'Failed to delete file', details: error.message }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });

    } else if (type === 'folder') {
      // Check if folder has files
      const { data: files, error: filesError } = await supabase
        .from('media_files')
        .select('id')
        .eq('folder_id', id)
        .eq('is_active', true);

      if (filesError) {
        console.error('Failed to check folder contents:', filesError);
        return NextResponse.json({ error: 'Failed to check folder contents' }, { status: 500 });
      }

      if (files && files.length > 0 && !force) {
        return NextResponse.json({ 
          error: 'Folder contains files. Use force=true to delete anyway.' 
        }, { status: 400 });
      }

      // Delete folder
      const { error } = await supabase
        .from('media_folders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete folder:', error);
        return NextResponse.json({ error: 'Failed to delete folder', details: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Folder deleted successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid type specified' }, { status: 400 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
