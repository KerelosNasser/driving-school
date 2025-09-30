
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('page_content')
    .select('page_name')
    .distinct();

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const pageIds = data.map((item) => item.page_name);

  return NextResponse.json(pageIds);
}
