// Schema.org Generator - Structured Data for SEO
'use client';

import React from 'react';
import type { Page } from '@/lib/types/pages';

interface SchemaGeneratorProps {
  page: Page;
  siteConfig?: {
    name: string;
    url: string;
    logo: string;
    description: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
}

export function generateSchemaMarkup({ page, siteConfig }: SchemaGeneratorProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${baseUrl}/${page.slug}`;
  
  const defaultSiteConfig = {
    name: 'Professional Driving School',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Professional driving lessons with experienced instructors',
    phone: '+1-555-0123',
    address: {
      street: '123 Main Street',
      city: 'Anytown',
      state: 'ST',
      postalCode: '12345',
      country: 'US'
    }
  };

  const config = { ...defaultSiteConfig, ...siteConfig };
  
  // Base Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${config.url}#organization`,
    name: config.name,
    url: config.url,
    logo: {
      '@type': 'ImageObject',
      url: config.logo
    },
    description: config.description,
    telephone: config.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address.street,
      addressLocality: config.address.city,
      addressRegion: config.address.state,
      postalCode: config.address.postalCode,
      addressCountry: config.address.country
    },
    sameAs: [
      // Add social media URLs here
    ]
  };

  // Website Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.url}#website`,
    url: config.url,
    name: config.name,
    description: config.description,
    publisher: {
      '@id': `${config.url}#organization`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  // Generate page-specific schema based on page type and content
  const generatePageSchema = () => {
    const basePageSchema = {
      '@context': 'https://schema.org',
      '@type': getSchemaType(page),
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.meta_data?.title || page.title,
      description: page.meta_data?.description || '',
      isPartOf: {
        '@id': `${config.url}#website`
      },
      about: {
        '@id': `${config.url}#organization`
      },
      datePublished: page.published_at,
      dateModified: page.updated_at,
      author: {
        '@id': `${config.url}#organization`
      }
    };

    // Add specific schema based on page slug/type
    switch (page.slug) {
      case 'home':
        return {
          ...basePageSchema,
          '@type': 'WebPage',
          mainEntity: {
            '@id': `${config.url}#organization`
          }
        };

      case 'about':
        return {
          ...basePageSchema,
          '@type': 'AboutPage'
        };

      case 'contact':
        return {
          ...basePageSchema,
          '@type': 'ContactPage',
          mainEntity: {
            '@type': 'ContactPoint',
            telephone: config.phone,
            contactType: 'customer service',
            availableLanguage: 'English'
          }
        };

      case 'packages':
      case 'services':
        return {
          ...basePageSchema,
          '@type': 'CollectionPage',
          mainEntity: generateServiceSchema()
        };

      case 'reviews':
        return {
          ...basePageSchema,
          '@type': 'WebPage',
          mainEntity: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '127',
            itemReviewed: {
              '@id': `${config.url}#organization`
            }
          }
        };

      default:
        return basePageSchema;
    }
  };

  const generateServiceSchema = () => {
    return {
      '@type': 'Service',
      '@id': `${config.url}#driving-lessons`,
      name: 'Driving Lessons',
      description: 'Professional driving instruction for new drivers',
      provider: {
        '@id': `${config.url}#organization`
      },
      serviceType: 'Driving Instruction',
      areaServed: {
        '@type': 'State',
        name: config.address.state
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Driving Lesson Packages',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Basic Driving Package',
              description: '10 hours of professional driving instruction'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Intensive Driving Course',
              description: '20 hours of intensive driving lessons'
            }
          }
        ]
      }
    };
  };

  const generateBreadcrumbSchema = () => {
    const breadcrumbs = getBreadcrumbs(page.slug);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  };

  const getBreadcrumbs = (slug: string) => {
    const breadcrumbs = [
      { name: 'Home', url: config.url }
    ];

    if (slug !== 'home') {
      breadcrumbs.push({
        name: page.title,
        url: pageUrl
      });
    }

    return breadcrumbs;
  };

  const getSchemaType = (page: Page): string => {
    if (page.meta_data?.schema_type) {
      return page.meta_data.schema_type;
    }

    // Auto-detect based on slug
    switch (page.slug) {
      case 'about':
        return 'AboutPage';
      case 'contact':
        return 'ContactPage';
      case 'reviews':
        return 'WebPage';
      default:
        return 'WebPage';
    }
  };

  // Generate FAQ schema if page has FAQ content
  const generateFAQSchema = () => {
    const faqBlocks = page.content?.blocks?.filter(block => 
      block.type === 'faq' || 
      (block.type === 'text' && block.props?.content?.includes('Q:'))
    );

    if (!faqBlocks || faqBlocks.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqBlocks.map(block => ({
        '@type': 'Question',
        name: extractQuestionFromContent(block.props?.content || ''),
        acceptedAnswer: {
          '@type': 'Answer',
          text: extractAnswerFromContent(block.props?.content || '')
        }
      }))
    };
  };

  const extractQuestionFromContent = (content: string): string => {
    const match = content.match(/Q:\s*([^?]+\?)/i);
    return match ? match[1] : '';
  };

  const extractAnswerFromContent = (content: string): string => {
    const match = content.match(/A:\s*([^Q]+)/i);
    return match ? match[1].trim() : '';
  };

  // Generate all schema types
  const schemas: any[] = [
    organizationSchema,
    websiteSchema,
    generatePageSchema(),
    generateBreadcrumbSchema()
  ];

  const faqSchema = generateFAQSchema();
  if (faqSchema) {
    schemas.push(faqSchema);
  }

  return schemas;
}

// React component to inject schema markup
export function SchemaMarkup({ page, siteConfig }: SchemaGeneratorProps) {
  const schemas = generateSchemaMarkup({ page, siteConfig });

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2)
          }}
        />
      ))}
    </>
  );
}

// Hook for generating schema in Next.js pages
export function useSchemaMarkup(page: Page, siteConfig?: any) {
  return generateSchemaMarkup({ page, siteConfig });
}

// Utility function to validate schema markup
export function validateSchema(schema: any): boolean {
  try {
    // Basic validation
    if (!schema['@context'] || !schema['@type']) {
      return false;
    }

    // Check required fields based on type
    switch (schema['@type']) {
      case 'Organization':
      case 'EducationalOrganization':
        return !!(schema.name && schema.url);
      
      case 'WebPage':
      case 'AboutPage':
      case 'ContactPage':
        return !!(schema.name && schema.url);
      
      case 'Service':
        return !!(schema.name && schema.provider);
      
      default:
        return true;
    }
  } catch (error) {
    console.error('Schema validation error:', error);
    return false;
  }
}