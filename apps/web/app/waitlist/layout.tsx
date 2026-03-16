import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://optionslab.io";

export const metadata: Metadata = {
  title: "Join the Waitlist — OptionsLab",
  description:
    "Request beta access to OptionsLab — the S&P 500 options analyzer that gives retail traders institutional-grade tools for screeing, Greeks analysis, and backtesting.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${siteUrl}/waitlist`,
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
