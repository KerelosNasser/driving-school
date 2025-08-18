import { createClient } from '@supabase/supabase-js';
import { SiteContent } from './types';

// This is a server-side only client for fetching published content.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type PageContent = Record<string, SiteContent>;

/**
 * Fetches all active and published content for a given page section.
 * @param section The page_section key (e.g., 'home', 'about').
 * @returns A key-value map of the content for easy access.
 */
export async function getPageContent(section: string): Promise<PageContent> {
  const { data, error } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('page_section', section)
    .eq('is_active', true)
    .eq('is_draft', false);

  if (error) {
    console.error(`Error fetching content for section "${section}":`, error);
    return {};
  }

  if (!data) {
    return {};
  }

  // Transform the array into a key-value object for easy access
  const contentMap = data.reduce((acc: PageContent, item: SiteContent) => {
    acc[item.content_key] = item;
    return acc;
  }, {});

  return contentMap;
}
