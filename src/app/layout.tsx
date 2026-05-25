import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Nexus Social – Where Communities Come to Life",
    template: "%s | Nexus Social",
  },
  description:
    "Nexus is a modern social platform for communities to connect, share, vote, and discuss. Join thousands of communities on topics you care about.",
  keywords: ["social media", "communities", "discussions", "forum", "reddit alternative"],
  authors: [{ name: "Nexus Social" }],
  creator: "Nexus Social",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://nexus.social",
    title: "Nexus Social – Where Communities Come to Life",
    description:
      "A modern social platform for communities to connect, share, vote, and discuss.",
    siteName: "Nexus Social",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexus Social",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Social",
    description: "Where Communities Come to Life",
    images: ["/og-image.png"],
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
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <MobileNav />
          </div>
          <Toaster
            position="bottom-right"
            richColors
            expand
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
