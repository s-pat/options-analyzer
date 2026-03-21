// Root layout — intentionally minimal. ClerkProvider and MobileLayout have
// been moved to app/(app)/layout.tsx so they only load for authenticated routes.
// Public pages (/landing, /design) never load Clerk's ~350KB SDK, eliminating
// the main source of 8+ second First Input Delay on low-end mobile devices.
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Don't eagerly preload mono — only used for numbers/code, not body text.
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#060608",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://optionslab.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OptionLabs — S&P 500 Options Analyzer & Screener",
    template: "%s | OptionLabs",
  },
  description:
    "Scan 503 S&P 500 options, analyze real-time Greeks, IV rank, and backtest strategies. Institutional-grade options trading platform built for retail traders.",
  keywords: [
    "options trading",
    "options analyzer",
    "S&P 500 options",
    "options screener",
    "implied volatility",
    "IV rank",
    "options Greeks",
    "options backtesting",
    "options chain",
    "delta options",
    "options scanner",
    "stock options analysis",
    "options strategy",
    "Black-Scholes",
    "retail options trading",
  ],
  authors: [{ name: "OptionLabs" }],
  creator: "OptionLabs",
  publisher: "OptionLabs",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "OptionLabs",
    title: "OptionLabs — S&P 500 Options Analyzer & Screener",
    description:
      "Scan 503 S&P 500 options, analyze real-time Greeks, IV rank, and backtest strategies. Institutional-grade options trading platform built for retail traders.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OptionLabs — S&P 500 Options Analyzer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OptionLabs — S&P 500 Options Analyzer & Screener",
    description:
      "Scan 503 S&P 500 options, analyze real-time Greeks, IV rank, and backtest strategies. Institutional-grade options trading for retail traders.",
    images: ["/og-image.png"],
    creator: "@optionslab",
    site: "@optionslab",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Clerk — preconnect to all three hosts it uses:
            1. Custom frontend API (sign-in UI + session tokens)
            2. clerk.accounts.dev — where clerk.browser.js is actually served from
            3. api.clerk.dev — auth API requests */}
        <link rel="preconnect" href="https://clerk.optionslab.io" />
        <link rel="preconnect" href="https://api.clerk.dev" />
        <link rel="preconnect" href="https://clerk.accounts.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.clerk.dev" />
        <link rel="dns-prefetch" href="https://clerk.accounts.dev" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
