
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { title, slug } = await req.json();

  if (!title || !slug) {
    return new NextResponse('Missing title or slug', { status: 400 });
  }

  // Create a default content for the new page
  const defaultContent = [
    {
      page_name: slug,
      content_key: 'hero_title',
      content_value: title,
      content_type: 'text',
    },
    {
      page_name: slug,
      content_key: 'hero_subtitle',
      content_value: 'This is a new page. Click to edit the content.',
      content_type: 'text',
    },
  ];

  const { error } = await supabase.from('page_content').insert(defaultContent);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ slug });
}
