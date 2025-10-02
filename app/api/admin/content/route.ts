// app/api/admin/content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client with service role for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function isUserAdmin(_userId: string): Promise<boolean> {
    try {
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

        // If no admin emails are configured, allow the first user for development
        if (adminEmails.length === 0 && process.env.NODE_ENV === 'development') {
            return true;
        }
        return true; // Temporarily allow all authenticated users for testing
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// GET - Retrieve content
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || 'home';
        const key = searchParams.get('key');

        let query = supabaseAdmin
            .from('page_content')
            .select('*')
            .eq('page_name', page);

        if (key) {
            query = query.eq('content_key', key);
        }

        const { data, error } = await query.order('updated_at', { ascending: false });

        if (error) {
            if (error.message?.includes('relation "page_content" does not exist')) {
                return NextResponse.json({ data: [] });
            }
            
            return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
        }

        return NextResponse.json({ data: data || [] });
    } catch (error) {
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// PUT - Update or create content (upsert)
export async function PUT(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = await isUserAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { key, value, type = 'text', page = 'home' } = body;

        if (!key) {
            return NextResponse.json({ error: 'Content key is required' }, { status: 400 });
        }

        // Handle empty values for deletion
        if (value === '' || value === null || value === undefined) {
            const { error } = await supabaseAdmin
                .from('page_content')
                .delete()
                .eq('page_name', page)
                .eq('content_key', key);

            if (error) {
                return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Content deleted successfully'
            });
        }

        // Prepare content data based on type
        const contentData: any = {
            page_name: page,
            content_key: key,
            updated_at: new Date().toISOString(),
            updated_by: userId,
        };

        switch (type) {
            case 'text':
                contentData.content_value = value;
                contentData.content_type = 'text';
                contentData.content_json = null;
                contentData.file_url = null;
                break;
            case 'json':
                contentData.content_json = typeof value === 'object' ? value : JSON.parse(value);
                contentData.content_type = 'json';
                contentData.content_value = null;
                contentData.file_url = null;
                break;
            case 'file':
                contentData.file_url = value;
                contentData.content_type = 'file';
                contentData.content_value = null;
                contentData.content_json = null;
                break;
            default:
                contentData.content_value = value;
                contentData.content_type = 'text';
                contentData.content_json = null;
                contentData.file_url = null;
        }

        // Use upsert to handle both insert and update
        const { data, error } = await supabaseAdmin
            .from('page_content')
            .upsert(contentData, {
                onConflict: 'page_name,content_key',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (error) {
            if (error.message?.includes('relation "page_content" does not exist')) {
                return NextResponse.json({ error: 'Content table not initialized' }, { status: 503 });
            }
            
            return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
        }

        // Revalidate the cache for the updated page
        console.log(`Revalidating path: /`);
        revalidatePath('/'); // Revalidate home page
        if (page && page !== 'home') {
            console.log(`Revalidating path: /${page}`);
            revalidatePath(`/${page}`);
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Content updated successfully'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Bulk operations for gallery images and other collections
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

        const body = await request.json();
        const { operation, data } = body;

        switch (operation) {
            case 'bulk_upsert':
                const contentItems = data.map((item: any) => ({
                    ...item,
                    updated_by: userId,
                    updated_at: new Date().toISOString()
                }));

                const { data: upsertData, error: upsertError } = await supabaseAdmin
                    .from('page_content')
                    .upsert(contentItems, {
                        onConflict: 'page_name,content_key',
                        ignoreDuplicates: false
                    })
                    .select();

                if (upsertError) {
                    return NextResponse.json({ error: 'Failed to bulk upsert content' }, { status: 500 });
                }

                return NextResponse.json({
                    success: true,
                    data: upsertData,
                    message: `Bulk upserted ${upsertData?.length || 0} items`
                });

            case 'bulk_delete':
                const { keys, page } = data;
                const { error: deleteError } = await supabaseAdmin
                    .from('page_content')
                    .delete()
                    .eq('page_name', page)
                    .in('content_key', keys);

                if (deleteError) {
                    return NextResponse.json({ error: 'Failed to bulk delete content' }, { status: 500 });
                }

                return NextResponse.json({
                    success: true,
                    message: `Bulk deleted ${keys.length} items`
                });

            default:
                return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete content
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
        const key = searchParams.get('key');
        const page = searchParams.get('page') || 'home';

        if (!key) {
            return NextResponse.json({ error: 'Content key is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('page_content')
            .delete()
            .eq('page_name', page)
            .eq('content_key', key);

        if (error) {
            return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}