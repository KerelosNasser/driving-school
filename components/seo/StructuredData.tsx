'use client'

export function OrganizationSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    "name": "EG Driving School",
    "description": "Professional driving instruction service offering comprehensive driving lessons and test preparation.",
    "url": "https://your-domain.vercel.app",
    "logo": "https://your-domain.vercel.app/logo.png",
    "image": "https://your-domain.vercel.app/og-image.jpg",
    "telephone": "+61-XXX-XXX-XXX", // Replace with actual phone
    "email": "info@egdrivingschool.com", // Replace with actual email
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Your Street Address",
      "addressLocality": "Your City",
      "addressRegion": "Your State",
      "postalCode": "Your Postal Code",
      "addressCountry": "AU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -27.4698, // Replace with actual coordinates
      "longitude": 153.0251
    },
    "openingHours": [
      "Mo-Fr 08:00-18:00",
      "Sa 08:00-16:00",
      "Su 10:00-16:00"
    ],
    "priceRange": "$$",
    "areaServed": {
      "@type": "State",
      "name": "Queensland"
    },
    "serviceType": "Driving Instruction",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Driving Lesson Packages",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Beginner Package",
            "description": "Perfect for beginners who are just starting their driving journey"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Standard Package",
            "description": "Our most popular package for learners with some experience"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Premium Package",
            "description": "Comprehensive package for complete preparation"
          }
        }
      ]
    },
    "sameAs": [
      "https://www.facebook.com/egdrivingschool", // Replace with actual social media
      "https://www.instagram.com/egdrivingschool",
      "https://www.linkedin.com/company/egdrivingschool"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  )
}

export function LocalBusinessSchema() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://your-domain.vercel.app/#organization",
    "name": "EG Driving School",
    "description": "Professional driving school offering comprehensive driving lessons and test preparation with experienced instructors.",
    "url": "https://your-domain.vercel.app",
    "telephone": "+61-XXX-XXX-XXX",
    "email": "info@egdrivingschool.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Your Street Address",
      "addressLocality": "Your City",
      "addressRegion": "Your State",
      "postalCode": "Your Postal Code",
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
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "08:00",
        "closes": "16:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "10:00",
        "closes": "16:00"
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