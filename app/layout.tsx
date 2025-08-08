import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
} from '@clerk/nextjs';
import { Toaster } from 'sonner';
import "./globals.css";
import {Navigation} from "@/components/navigation";
import {Footer} from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brisbane Driving School - Professional Driving Lessons",
  description: "Learn to drive with Brisbane's most trusted driving school. Professional instructors, flexible scheduling, and comprehensive packages.",
  keywords: "driving lessons Brisbane, driving school, learn to drive, driving instructor",
  openGraph: {
    title: "Brisbane Driving School - Professional Driving Lessons",
    description: "Learn to drive with Brisbane's most trusted driving school.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navigation />
          {children}
          <Footer />
          <Toaster richColors />
          {/* Free AI Chatbot Widget */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  var chatbot = document.createElement('script');
                  chatbot.src = 'https://widget.chatbot.com/widget.js';
                  chatbot.setAttribute('data-widget-id', '${process.env.NEXT_PUBLIC_CHATBOT_WIDGET_ID}');
                  document.head.appendChild(chatbot);
                })();
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
