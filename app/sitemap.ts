import { MetadataRoute } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://your-domain.vercel.app' // Replace with your actual domain
  
  // Get packages for dynamic URLs
  const supabase = await createServerComponentClient({ cookies })
  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  const packageUrls = packages?.map((pkg) => ({
    url: `${baseUrl}/packages/${pkg.id}`,
    lastModified: new Date(pkg.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || []

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/packages`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    ...packageUrls,
  ]
}
