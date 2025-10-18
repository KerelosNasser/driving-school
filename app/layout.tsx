import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import { WebVitals } from "@/components/seo/WebVitals";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import PostSignupWrapper from "@/components/PostSignupWrapper";
import { Suspense } from "react";
import { EditModeProvider } from "@/contexts/editModeContext";
import { GlobalContentProvider } from "@/contexts/globalContentContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AndroidStyleEditor } from "@/components/drag-drop/AndroidStyleEditor";
import { ReactQueryProvider } from "@/components/providers";

// Optimized font loading
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.vercel.app"
  ),
  title: {
    default: "EG Driving School - Professional Driving Lessons & Training",
    template: "%s | EG Driving School",
  },
  description:
    "Learn to drive with EG Driving School - Australia's premier driving instruction service. Professional instructors, flexible scheduling, comprehensive packages, and excellent pass rates. Book your driving lessons today!",
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
    "driving license training",
  ],
  authors: [{ name: "EG Driving School" }],
  creator: "EG Driving School",
  publisher: "EG Driving School",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "EG Driving School",
    title: "EG Driving School - Professional Driving Lessons & Training",
    description:
      "Learn to drive with EG Driving School - Australia's premier driving instruction service. Professional instructors, flexible scheduling, and comprehensive packages.",
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
    description:
      "Learn to drive with EG Driving School - Australia's premier driving instruction service.",
    images: ["/twitter-image.jpg"],
    creator: "@egdrivingschool",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Critical resource hints */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
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
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ReactQueryProvider>
            <ThemeProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <EditModeProvider>
                  <GlobalContentProvider>
                    <PostSignupWrapper>
                      <LayoutWrapper>
                        <AndroidStyleEditor>{children}</AndroidStyleEditor>
                      </LayoutWrapper>
                    </PostSignupWrapper>
                  </GlobalContentProvider>
                </EditModeProvider>
              </Suspense>
            </ThemeProvider>
          </ReactQueryProvider>

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