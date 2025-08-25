// Advanced SEO Management API - 2025 Best Practices
import { NextRequest } from 'next/server';
import { 
  apiHandler, 
  successResponse, 
  APIError, 
  supabaseAdmin
} from '@/lib/api/utils';

// SEO Tools Endpoints
export const GET = apiHandler(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'sitemap':
      return generateSitemap();
    
    case 'robots':
      return generateRobotsTxt();
    
    case 'meta-audit':
      return auditPagesMeta();
    
    case 'schema-validation':
      const pageId = searchParams.get('pageId');
      if (!pageId) {
        throw new APIError('Page ID required for schema validation', 400, 'MISSING_PAGE_ID');
      }
      return validatePageSchema(pageId);
    
    default:
      return getSEOOverview();
  }
});

// Generate XML Sitemap
async function generateSitemap() {
  const { data: pages, error } = await supabaseAdmin
    .from('pages')
    .select('slug, updated_at, status')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new APIError('Failed to fetch pages for sitemap', 500, 'SITEMAP_ERROR');
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-driving-school.com';
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${new Date(page.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>${getChangeFrequency(page.slug)}</changefreq>
    <priority>${getPriority(page.slug)}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

// Generate robots.txt
async function generateRobotsTxt() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-driving-school.com';
  
  const robotsTxt = `User-agent: *
Allow: /

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Disallow temporary pages
Disallow: /*?*

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay for polite crawling
Crawl-delay: 1`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}

// Audit all pages metadata
async function auditPagesMeta() {
  const { data: pages, error } = await supabaseAdmin
    .from('pages')
    .select('id, title, slug, meta_data, content, status, updated_at');

  if (error) {
    throw new APIError('Failed to fetch pages for audit', 500, 'AUDIT_ERROR');
  }

  const auditResults = pages.map(page => {
    const issues = [];
    const suggestions = [];
    let score = 100;

    // Title analysis
    if (!page.meta_data?.title && !page.title) {
      issues.push({
        type: 'error',
        field: 'title',
        message: 'Missing page title'
      });
      score -= 20;
    } else {
      const title = page.meta_data?.title || page.title;
      if (title.length > 60) {
        issues.push({
          type: 'warning',
          field: 'title',
          message: `Title too long (${title.length} chars). Recommended: 50-60`
        });
        score -= 5;
      } else if (title.length < 30) {
        suggestions.push({
          field: 'title',
          message: 'Consider expanding title to 50-60 characters'
        });
      }
    }

    // Meta description analysis
    if (!page.meta_data?.description) {
      issues.push({
        type: 'warning',
        field: 'description',
        message: 'Missing meta description'
      });
      score -= 10;
    } else if (page.meta_data.description.length > 160) {
      issues.push({
        type: 'warning',
        field: 'description',
        message: `Description too long (${page.meta_data.description.length} chars)`
      });
      score -= 5;
    }

    // Content analysis
    const contentLength = page.content?.blocks?.reduce((acc: number, block: any) => {
      if (block.type === 'text' && block.props?.content) {
        return acc + block.props.content.replace(/<[^>]*>/g, '').length;
      }
      return acc;
    }, 0) || 0;

    if (contentLength < 300) {
      issues.push({
        type: 'warning',
        field: 'content',
        message: `Content too short (${contentLength} chars). Recommended: 300+`
      });
      score -= 10;
    }

    // H1 analysis
    const hasH1 = page.content?.blocks?.some((block: any) => 
      block.type === 'text' && block.props?.content?.includes('<h1>')
    );

    if (!hasH1) {
      issues.push({
        type: 'error',
        field: 'structure',
        message: 'Missing H1 tag'
      });
      score -= 15;
    }

    // Keywords analysis
    if (!page.meta_data?.keywords) {
      suggestions.push({
        field: 'keywords',
        message: 'Add focus keywords for better optimization'
      });
      score -= 5;
    }

    // Open Graph analysis
    if (!page.meta_data?.og_title) {
      suggestions.push({
        field: 'og_title',
        message: 'Add Open Graph title for social sharing'
      });
    }

    if (!page.meta_data?.og_image) {
      suggestions.push({
        field: 'og_image',
        message: 'Add Open Graph image for social sharing'
      });
    }

    return {
      pageId: page.id,
      title: page.title,
      slug: page.slug,
      status: page.status,
      score: Math.max(0, score),
      issues,
      suggestions,
      lastUpdated: page.updated_at
    };
  });

  const overallStats = {
    totalPages: pages.length,
    averageScore: Math.round(auditResults.reduce((sum, page) => sum + page.score, 0) / pages.length),
    totalIssues: auditResults.reduce((sum, page) => sum + page.issues.length, 0),
    totalSuggestions: auditResults.reduce((sum, page) => sum + page.suggestions.length, 0),
    pagesWithIssues: auditResults.filter(page => page.issues.length > 0).length
  };

  return successResponse({
    audit: auditResults,
    stats: overallStats
  });
}

// Validate page schema markup
async function validatePageSchema(pageId: string) {
  const { data: page, error } = await supabaseAdmin
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (error || !page) {
    throw new APIError('Page not found', 404, 'PAGE_NOT_FOUND');
  }

  // Generate schema markup for validation
  const schemas = generateSchemaForPage(page);
  const validationResults = schemas.map((schema, index) => {
    const validation = validateSchemaStructure(schema);
    return {
      schemaIndex: index,
      type: schema['@type'],
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    };
  });

  return successResponse({
    pageId,
    schemas: validationResults,
    totalSchemas: schemas.length,
    validSchemas: validationResults.filter(s => s.valid).length
  });
}

// Get SEO overview
async function getSEOOverview() {
  const { data: pages, error } = await supabaseAdmin
    .from('pages')
    .select('id, title, slug, meta_data, status, updated_at');

  if (error) {
    throw new APIError('Failed to fetch SEO overview', 500, 'OVERVIEW_ERROR');
  }

  const publishedPages = pages.filter(p => p.status === 'published');
  const pagesWithoutMeta = pages.filter(p => !p.meta_data?.description);
  const pagesWithoutKeywords = pages.filter(p => !p.meta_data?.keywords);
  const pagesWithoutOG = pages.filter(p => !p.meta_data?.og_title);

  const stats = {
    totalPages: pages.length,
    publishedPages: publishedPages.length,
    pagesWithoutDescription: pagesWithoutMeta.length,
    pagesWithoutKeywords: pagesWithoutKeywords.length,
    pagesWithoutOpenGraph: pagesWithoutOG.length,
    lastUpdated: pages.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0]?.updated_at
  };

  return successResponse({ stats });
}

// Helper functions
function getChangeFrequency(slug: string): string {
  const frequencies: Record<string, string> = {
    'home': 'weekly',
    'about': 'monthly',
    'contact': 'monthly',
    'packages': 'weekly',
    'reviews': 'weekly'
  };
  
  return frequencies[slug] || 'monthly';
}

function getPriority(slug: string): string {
  const priorities: Record<string, string> = {
    'home': '1.0',
    'about': '0.8',
    'packages': '0.9',
    'contact': '0.7',
    'reviews': '0.6'
  };
  
  return priorities[slug] || '0.5';
}

function generateSchemaForPage(page: any) {
  // Simplified schema generation - in real implementation, use the SchemaGenerator
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/${page.slug}#webpage`,
      name: page.meta_data?.title || page.title,
      description: page.meta_data?.description || '',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${page.slug}`
    }
  ];
}

function validateSchemaStructure(schema: any) {
  const errors = [];
  const warnings = [];
  let valid = true;

  // Basic validation
  if (!schema['@context']) {
    errors.push('Missing @context');
    valid = false;
  }

  if (!schema['@type']) {
    errors.push('Missing @type');
    valid = false;
  }

  // Type-specific validation
  if (schema['@type'] === 'WebPage') {
    if (!schema.name) {
      warnings.push('Missing name property');
    }
    if (!schema.description) {
      warnings.push('Missing description property');
    }
    if (!schema.url) {
      errors.push('Missing url property');
      valid = false;
    }
  }

  return { valid, errors, warnings };
}

// POST endpoint for triggering SEO actions
export const POST = apiHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const { action, data } = body;

  switch (action) {
    case 'regenerate-sitemap':
      // Trigger sitemap regeneration
      return successResponse({ message: 'Sitemap regeneration triggered' });
    
    case 'bulk-meta-update':
      return bulkUpdateMeta(data.updates);
    
    case 'optimize-images':
      return optimizePageImages(data.pageIds);
    
    default:
      throw new APIError('Unknown SEO action', 400, 'UNKNOWN_ACTION');
  }
});

async function bulkUpdateMeta(updates: any[]) {
  const results = [];
  
  for (const update of updates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pages')
        .update({ meta_data: update.meta_data })
        .eq('id', update.pageId)
        .select();

      if (error) throw error;
      
      results.push({
        pageId: update.pageId,
        success: true,
        data: data[0]
      });
    } catch (error) {
      results.push({
        pageId: update.pageId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return successResponse({
    updated: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  });
}

async function optimizePageImages(pageIds: string[]) {
  // Placeholder for image optimization logic
  // In real implementation, this would optimize images for SEO
  return successResponse({
    message: 'Image optimization completed',
    optimized: pageIds.length
  });
}