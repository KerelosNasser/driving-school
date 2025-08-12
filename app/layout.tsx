import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { WebVitals } from "@/components/seo/WebVitals";
import { Suspense } from 'react';

// Optimized font loading
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Improved font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.vercel.app'),
  title: {
    default: "EG Driving School - Professional Driving Lessons & Training",
    template: "%s | EG Driving School"
  },
  description: "Learn to drive with EG Driving School - Australia's premier driving instruction service. Professional instructors, flexible scheduling, comprehensive packages, and excellent pass rates. Book your driving lessons today!",
  keywords: [
    "driving lessons",
    "driving school",
    "learn to drive",
    "driving instructor",
    "driving test preparation",
    "professional driving lessons",
    "driving school near me",
    "beginner driving lessons",
    "defensive driving course",
    "driving license training"
  ],
  authors: [{ name: "EG Driving School" }],
  creator: "EG Driving School",
  publisher: "EG Driving School",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "EG Driving School",
    title: "EG Driving School - Professional Driving Lessons & Training",
    description: "Learn to drive with EG Driving School - Australia's premier driving instruction service. Professional instructors, flexible scheduling, and comprehensive packages.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EG Driving School - Professional Driving Lessons",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EG Driving School - Professional Driving Lessons & Training",
    description: "Learn to drive with EG Driving School - Australia's premier driving instruction service.",
    images: ["/twitter-image.jpg"],
    creator: "@egdrivingschool",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: "Education",
  classification: "Driving School",
  referrer: "strict-origin-when-cross-origin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Critical resource hints */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://images.unsplash.com" />
          <link rel="preconnect" href="https://api.stripe.com" />
          
          {/* DNS prefetch for external resources */}
          <link rel="dns-prefetch" href="https://widget.chatbot.com" />
          <link rel="dns-prefetch" href="https://clerk.accounts.dev" />
          
          {/* Favicon and app icons */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          
          {/* Theme color for mobile browsers */}
          <meta name="theme-color" content="#EDE513FF" />
          <meta name="msapplication-TileColor" content="#EDE513FF" />
          
          {/* Viewport optimization */}
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navigation />
          <main>
            {children}
          </main>
          <Footer />
          
          {/* Performance monitoring */}
          <Suspense fallback={null}>
            <WebVitals />
          </Suspense>
          
          <Toaster richColors position="top-right" />
          
          {/* Optimized chatbot loading */}
          {process.env.NEXT_PUBLIC_CHATBOT_WIDGET_ID && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    var chatbot = document.createElement('script');
                    chatbot.src = 'https://widget.chatbot.com/widget.js';
                    chatbot.setAttribute('data-widget-id', '${process.env.NEXT_PUBLIC_CHATBOT_WIDGET_ID}');
                    chatbot.async = true;
                    chatbot.defer = true;
                    document.head.appendChild(chatbot);
                  })();
                `,
              }}
            />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
