'use client'

import { useGlobalContent } from '@/contexts/globalContentContext';

export function OrganizationSchema() {
  const { content } = useGlobalContent();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    "name": content.business_name,
    "description": "Professional driving instruction service offering comprehensive driving lessons and test preparation.",
    "url": typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app',
    "logo": `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}/logo.png`,
    "image": `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}/og-image.jpg`,
    "telephone": content.business_phone,
    "email": content.business_email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": content.business_address || "",
      "addressLocality": "",
      "addressRegion": "",
      "postalCode": "",
      "addressCountry": "AU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -27.4698,
      "longitude": 153.0251
    },
    "openingHours": [content.operating_hours || "Mo-Fr 08:00-18:00"],
    "priceRange": "$$",
    "areaServed": {
      "@type": "State",
      "name": "Queensland"
    },
    "serviceType": "Driving Instruction",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Driving Lesson Packages",
      "itemListElement": []
    },
    "sameAs": [content.facebook_url || '', content.instagram_url || '', content.linkedin_url || '']
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  )
}

export function LocalBusinessSchema() {
  const { content } = useGlobalContent();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}/#organization`,
    "name": content.business_name,
    "description": "Professional driving school offering comprehensive driving lessons and test preparation with experienced instructors.",
    "url": typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app',
    "telephone": content.business_phone,
    "email": content.business_email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": content.business_address || "",
      "addressLocality": "",
      "addressRegion": "",
      "postalCode": "",
      "addressCountry": "AU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -27.4698,
      "longitude": 153.0251
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
    />
  )
}