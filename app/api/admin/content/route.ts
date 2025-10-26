import { supabaseAdmin } from '@/lib/api/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const contentKey = searchParams.get('contentKey');

    let query = supabaseAdmin.from('page_content').select('*');

    if (page) {
      query = query.eq('page_name', page);
    }

    if (contentKey) {
      query = query.eq('content_key', contentKey);
    }

    const { data: content, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching content:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch content',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      content: content || []
    });
  } catch (error) {
    console.error('Error in content GET API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page_name, content_key, content_type, content_text, content_json } = body;

    if (!page_name || !content_key || !content_type) {
      return NextResponse.json({ 
        error: 'Page name, content key, and content type are required' 
      }, { status: 400 });
    }

    const contentData = {
      page_name,
      content_key,
      content_type,
      content_text: content_text || null,
      content_json: content_json || null,
      updated_at: new Date().toISOString()
    };

    const { data: content, error } = await supabaseAdmin
      .from('page_content')
      .upsert(contentData, {
        onConflict: 'page_name,content_key'
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving content:', error);
      return NextResponse.json({ 
        error: 'Failed to save content',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      content,
      message: 'Content saved successfully'
    });
  } catch (error) {
    console.error('Error in content POST API:', error);
    return NextResponse.json({ 
      error: 'Failed to save content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const contentKey = searchParams.get('contentKey');

    if (!page || !contentKey) {
      return NextResponse.json({ 
        error: 'Page and content key are required' 
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('page_content')
      .delete()
      .eq('page_name', page)
      .eq('content_key', contentKey);

    if (error) {
      console.error('Error deleting content:', error);
      return NextResponse.json({ 
        error: 'Failed to delete content',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error in content DELETE API:', error);
    return NextResponse.json({ 
      error: 'Failed to delete content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}