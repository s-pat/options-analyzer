import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://optionslab.io";
const landingUrl = `${siteUrl}/landing`;

export const metadata: Metadata = {
  title: "OptionLabs — Options Trading Platform for S&P 500",
  description:
    "Scan the entire S&P 500 options market, analyze chains with real-time Greeks and IV rank, backtest strategies, and get daily high-probability trade picks. Free beta access.",
  keywords: [
    "options trading platform",
    "S&P 500 options screener",
    "options chain analyzer",
    "implied volatility rank",
    "IV rank screener",
    "options Greeks calculator",
    "options backtesting",
    "daily options picks",
    "options strategy platform",
    "retail options trading",
    "options market scanner",
    "Black-Scholes calculator",
    "delta neutral options",
    "covered calls screener",
    "cash secured puts",
    "iron condor screener",
    "options flow analysis",
    "real-time options data",
  ],
  alternates: {
    canonical: landingUrl,
  },
  openGraph: {
    type: "website",
    url: landingUrl,
    title: "OptionLabs — Options Trading Platform for S&P 500",
    description:
      "Scan the entire S&P 500 options market, analyze chains with real-time Greeks and IV rank, backtest strategies, and get daily high-probability trade picks.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OptionLabs — S&P 500 Options Analyzer Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OptionLabs — Options Trading Platform for S&P 500",
    description:
      "Scan 503 S&P 500 options, real-time Greeks, IV rank, backtesting & daily picks. Institutional-grade tools for retail traders.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "OptionLabs",
      url: landingUrl,
      description:
        "Institutional-grade options trading platform for retail investors. Scan 503 S&P 500 options, analyze real-time Greeks, IV rank, and backtest strategies.",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free beta access",
      },
      featureList: [
        "S&P 500 options screener with IV Rank and Greeks filtering",
        "Real-time options chain analysis with Black-Scholes fair value",
        "Strategy backtesting against 1-2 years of historical data",
        "Daily AI-scored high-probability trade picks",
        "Options education center and strategy templates",
        "503 S&P 500 stocks covered, 2M+ options contracts tracked",
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        ratingCount: "1",
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "WebSite",
      name: "OptionLabs",
      url: siteUrl,
      description:
        "S&P 500 options analyzer and trading platform for retail investors.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/options?symbol={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "OptionLabs",
      url: siteUrl,
      description:
        "Options trading analysis platform providing institutional-grade tools for retail investors.",
      sameAs: [],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is OptionLabs?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "OptionLabs is an institutional-grade options trading platform for retail investors. It scans 503 S&P 500 stocks, tracks 2M+ options contracts, provides real-time Greeks, IV rank analysis, strategy backtesting, and daily trade picks.",
          },
        },
        {
          "@type": "Question",
          name: "What is IV Rank (Implied Volatility Rank)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "IV Rank measures where current implied volatility sits relative to its 52-week range. A high IV Rank (above 50) means options are expensive relative to history — ideal for selling premium strategies. OptionLabs displays IV Rank for all 503 S&P 500 stocks.",
          },
        },
        {
          "@type": "Question",
          name: "What options strategies can I backtest?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "OptionLabs supports backtesting long calls, long puts, and other directional strategies against 1-2 years of historical price data to validate your edge before risking real capital.",
          },
        },
        {
          "@type": "Question",
          name: "How much does OptionLabs cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "OptionLabs is currently in beta and free to access. Request beta access on the website to get started.",
          },
        },
      ],
    },
  ],
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
