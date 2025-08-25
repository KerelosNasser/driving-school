// Modern Pages API - Following 2025 best practices
import { NextRequest } from 'next/server';
import { 
  apiHandler, 
  successResponse, 
  APIError, 
  supabaseAdmin, 
  pageValidation,
  getPaginationParams,
  generateSlug,
  sanitizeContent
} from '@/lib/api/utils';
import type { Page, CreatePageRequest, UpdatePageRequest } from '@/lib/types/pages';

export const GET = apiHandler(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  
  // If requesting a specific page by slug
  if (slug) {
    const { data: page, error } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new APIError('Page not found', 404, 'PAGE_NOT_FOUND');
      }
      throw new APIError('Failed to fetch page', 500, 'FETCH_ERROR');
    }

    return successResponse({ page });
  }

  // List pages with pagination and filtering
  const { page: pageNum, limit, offset } = getPaginationParams(searchParams);
  
  let query = supabaseAdmin
    .from('pages')
    .select('*', { count: 'exact' });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  // Apply pagination
  query = query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: pages, error, count } = await query;

  if (error) {
    throw new APIError('Failed to fetch pages', 500, 'FETCH_ERROR');
  }

  return successResponse({
    pages: pages || [],
    pagination: {
      total: count || 0,
      page: pageNum,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
});

export const POST = apiHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const validatedData = pageValidation.create.parse(body);

  // Generate slug if not provided
  if (!validatedData.slug) {
    validatedData.slug = generateSlug(validatedData.title);
  }

  // Check if slug already exists
  const { data: existingPage } = await supabaseAdmin
    .from('pages')
    .select('id')
    .eq('slug', validatedData.slug)
    .single();

  if (existingPage) {
    throw new APIError('A page with this slug already exists', 409, 'SLUG_EXISTS');
  }

  // Sanitize content
  if (validatedData.content) {
    validatedData.content = sanitizeContent(validatedData.content);
  }

  // Set defaults
  const pageData = {
    title: validatedData.title,
    slug: validatedData.slug,
    content: validatedData.content || { blocks: [] },
    meta_data: {
      description: '',
      keywords: '',
      ...validatedData.meta_data
    },
    settings: {
      layout: 'default',
      show_header: true,
      show_footer: true,
      ...validatedData.settings
    },
    status: validatedData.status || 'draft',
    author_id: userId,
    published_at: validatedData.status === 'published' ? new Date().toISOString() : null
  };

  const { data: page, error } = await supabaseAdmin
    .from('pages')
    .insert(pageData)
    .select()
    .single();

  if (error) {
    throw new APIError('Failed to create page', 500, 'CREATE_ERROR');
  }

  // Create initial revision
  await supabaseAdmin
    .from('page_revisions')
    .insert({
      page_id: page.id,
      content: page.content,
      meta_data: page.meta_data,
      settings: page.settings,
      author_id: userId,
      revision_note: 'Initial creation'
    });

  return successResponse({ page }, 201);
});

export const PUT = apiHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const { id, ...updateData } = body;

  if (!id) {
    throw new APIError('Page ID is required', 400, 'MISSING_ID');
  }

  const validatedData = pageValidation.update.parse(updateData);

  // Check if page exists
  const { data: existingPage, error: fetchError } = await supabaseAdmin
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existingPage) {
    throw new APIError('Page not found', 404, 'PAGE_NOT_FOUND');
  }

  // Check slug uniqueness if updating slug
  if (validatedData.slug && validatedData.slug !== existingPage.slug) {
    const { data: slugExists } = await supabaseAdmin
      .from('pages')
      .select('id')
      .eq('slug', validatedData.slug)
      .neq('id', id)
      .single();

    if (slugExists) {
      throw new APIError('A page with this slug already exists', 409, 'SLUG_EXISTS');
    }
  }

  // Sanitize content
  if (validatedData.content) {
    validatedData.content = sanitizeContent(validatedData.content);
  }

  // Prepare update data
  const updateFields: any = { ...validatedData };
  
  // Handle status changes
  if (validatedData.status === 'published' && existingPage.status !== 'published') {
    updateFields.published_at = new Date().toISOString();
  } else if (validatedData.status !== 'published') {
    updateFields.published_at = null;
  }

  const { data: page, error } = await supabaseAdmin
    .from('pages')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new APIError('Failed to update page', 500, 'UPDATE_ERROR');
  }

  // Create revision if content changed
  if (validatedData.content || validatedData.meta_data || validatedData.settings) {
    await supabaseAdmin
      .from('page_revisions')
      .insert({
        page_id: id,
        content: page.content,
        meta_data: page.meta_data,
        settings: page.settings,
        author_id: userId,
        revision_note: 'Content updated'
      });
  }

  return successResponse({ page });
});

export const DELETE = apiHandler(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new APIError('Page ID is required', 400, 'MISSING_ID');
  }

  // Check if page exists
  const { data: page, error: fetchError } = await supabaseAdmin
    .from('pages')
    .select('slug, title')
    .eq('id', id)
    .single();

  if (fetchError || !page) {
    throw new APIError('Page not found', 404, 'PAGE_NOT_FOUND');
  }

  // Prevent deletion of system pages
  const systemPages = ['home', 'about', 'contact', 'reviews', 'packages', 'book'];
  if (systemPages.includes(page.slug)) {
    throw new APIError('System pages cannot be deleted', 403, 'SYSTEM_PAGE');
  }

  const { error } = await supabaseAdmin
    .from('pages')
    .delete()
    .eq('id', id);

  if (error) {
    throw new APIError('Failed to delete page', 500, 'DELETE_ERROR');
  }

  return successResponse({ 
    message: 'Page deleted successfully',
    deleted: { id, title: page.title, slug: page.slug }
  });
});