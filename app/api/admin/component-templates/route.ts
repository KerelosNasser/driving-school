// Component Templates API - Modern architecture
import { NextRequest } from 'next/server';
import { 
  apiHandler, 
  successResponse, 
  APIError, 
  supabaseAdmin, 
  componentTemplateValidation,
  getPaginationParams
} from '@/lib/api/utils';
import type { ComponentTemplate } from '@/lib/types/pages';

export const GET = apiHandler(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const { page, limit, offset } = getPaginationParams(searchParams);
  
  let query = supabaseAdmin
    .from('component_templates')
    .select('*', { count: 'exact' });

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply pagination and ordering
  query = query
    .order('category', { ascending: true })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data: templates, error, count } = await query;

  if (error) {
    throw new APIError('Failed to fetch component templates', 500, 'FETCH_ERROR');
  }

  // Group by category for easier consumption
  const groupedTemplates = (templates || []).reduce((acc: Record<string, ComponentTemplate[]>, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  return successResponse({
    templates: templates || [],
    groupedTemplates,
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
});

export const POST = apiHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const validatedData = componentTemplateValidation.create.parse(body);

  const { data: template, error } = await supabaseAdmin
    .from('component_templates')
    .insert({
      ...validatedData,
      is_system: false,
      usage_count: 0
    })
    .select()
    .single();

  if (error) {
    throw new APIError('Failed to create component template', 500, 'CREATE_ERROR');
  }

  return successResponse({ template }, 201);
});

export const PUT = apiHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const { id, ...updateData } = body;

  if (!id) {
    throw new APIError('Template ID is required', 400, 'MISSING_ID');
  }

  // Check if template exists and is not system
  const { data: existingTemplate, error: fetchError } = await supabaseAdmin
    .from('component_templates')
    .select('is_system')
    .eq('id', id)
    .single();

  if (fetchError || !existingTemplate) {
    throw new APIError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
  }

  if (existingTemplate.is_system) {
    throw new APIError('System templates cannot be modified', 403, 'SYSTEM_TEMPLATE');
  }

  const validatedData = componentTemplateValidation.create.partial().parse(updateData);

  const { data: template, error } = await supabaseAdmin
    .from('component_templates')
    .update(validatedData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new APIError('Failed to update template', 500, 'UPDATE_ERROR');
  }

  return successResponse({ template });
});

export const DELETE = apiHandler(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new APIError('Template ID is required', 400, 'MISSING_ID');
  }

  // Check if template exists and is not system
  const { data: template, error: fetchError } = await supabaseAdmin
    .from('component_templates')
    .select('name, is_system')
    .eq('id', id)
    .single();

  if (fetchError || !template) {
    throw new APIError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
  }

  if (template.is_system) {
    throw new APIError('System templates cannot be deleted', 403, 'SYSTEM_TEMPLATE');
  }

  const { error } = await supabaseAdmin
    .from('component_templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new APIError('Failed to delete template', 500, 'DELETE_ERROR');
  }

  return successResponse({ 
    message: 'Template deleted successfully',
    deleted: { id, name: template.name }
  });
});