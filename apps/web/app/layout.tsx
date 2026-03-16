import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Don't eagerly preload mono — it's only used for numbers/code, not body text.
  // This removes one critical network request from the initial page load.
  preload: false,
});

// Viewport config — exported separately per Next.js 13+ spec.
// themeColor paints the Android Chrome toolbar/status bar to match the OLED
// background (#060608), preventing the jarring white flash on page load.
// viewportFit=cover lets content extend under iPhone notch/home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,    // allow pinch-zoom for accessibility
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
        <link rel="preconnect" href="https://clerk.optionslab.io" />
        <link rel="preconnect" href="https://api.clerk.dev" />
        <link rel="dns-prefetch" href="https://api.clerk.dev" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          afterSignOutUrl="/landing"
          appearance={{
            variables: {
              colorPrimary: "#3B82F6",
              colorBackground: "#16161e",
              colorInputBackground: "#1e1e2a",
              colorInputText: "#ffffff",
              colorText: "#f0f0f5",
              colorTextSecondary: "#9999aa",
              colorDanger: "#ef4444",
              colorSuccess: "#22c55e",
              colorNeutral: "#d0d0dd",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-geist-sans)",
            },
            elements: {
              rootBox: "w-full",
              card: "!bg-[#16161e] !border !border-white/20 !shadow-2xl !shadow-black/60",
              headerTitle: "!text-white !text-lg",
              headerSubtitle: "!text-white/60",
              socialButtonsBlockButton:
                "!bg-[#1e1e2a] !border !border-white/20 hover:!bg-[#2a2a38] !text-white transition-all",
              socialButtonsBlockButtonText: "!text-white !font-medium",
              socialButtonsProviderIcon: "brightness-0 invert",
              dividerLine: "!bg-white/20",
              dividerText: "!text-white/50",
              formFieldLabel: "!text-white/80",
              formFieldInput:
                "!bg-[#1e1e2a] !border !border-white/20 !text-white placeholder:!text-white/40 focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500/40",
              formButtonPrimary:
                "!bg-blue-500 hover:!bg-blue-400 !text-white !font-semibold transition-all duration-200 hover:!shadow-lg hover:!shadow-blue-500/25",
              footerActionLink: "!text-blue-400 hover:!text-blue-300",
              footerActionText: "!text-white/50",
              identityPreview: "!bg-[#1e1e2a] !border !border-white/20",
              identityPreviewText: "!text-white/80",
              identityPreviewEditButton: "!text-blue-400",
              otpCodeFieldInput:
                "!bg-[#1e1e2a] !border !border-white/20 !text-white !caret-white",
              formResendCodeLink: "!text-blue-400",
              alert: "!bg-[#1e1e2a] !border !border-white/20",
              alertText: "!text-white/80",
              userButtonAvatarBox: "w-7 h-7",
              userButtonPopoverCard: "!bg-[#16161e] !border !border-white/20",
              userButtonPopoverActionButton: "!text-white/80 hover:!bg-white/10",
              userButtonPopoverActionButtonText: "!text-white/80",
              userButtonPopoverFooter: "!hidden",
            },
          }}
        >
          <MobileLayout>{children}</MobileLayout>
        </ClerkProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
