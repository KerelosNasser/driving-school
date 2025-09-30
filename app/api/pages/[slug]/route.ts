
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getPageContent } from '@/lib/content';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const content = await getPageContent(slug);
  return NextResponse.json(content);
}
