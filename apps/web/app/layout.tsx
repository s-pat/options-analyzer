import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { MobileLayout } from "@/components/layout/MobileLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OptionsLab — S&P 500 Options Analyzer",
  description: "Analyze S&P 500 options opportunities with real-time market data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          afterSignOutUrl="/landing"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#3B82F6",
              colorBackground: "#0a0a0f",
              colorInputBackground: "rgba(255,255,255,0.06)",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-geist-sans)",
            },
            elements: {
              card: "bg-white/[0.025] border border-white/[0.08] shadow-2xl shadow-black/40",
              formButtonPrimary:
                "bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25",
              footerActionLink: "text-blue-400 hover:text-blue-300",
              socialButtonsBlockButton:
                "bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all",
              formFieldInput:
                "bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-white/25 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30",
              userButtonAvatarBox: "w-7 h-7",
            },
          }}
        >
          <MobileLayout>{children}</MobileLayout>
        </ClerkProvider>
      </body>
    </html>
  );
}
