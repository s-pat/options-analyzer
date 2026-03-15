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
              colorBackground: "#111118",
              colorInputBackground: "rgba(255,255,255,0.1)",
              colorInputText: "#ffffff",
              colorText: "#e2e2e2",
              colorTextSecondary: "#a0a0b0",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-geist-sans)",
            },
            elements: {
              card: "!bg-[#111118] border border-white/[0.12] shadow-2xl shadow-black/50",
              headerTitle: "text-white",
              headerSubtitle: "text-white/60",
              socialButtonsBlockButton:
                "!bg-white/[0.08] border border-white/[0.15] hover:!bg-white/[0.14] text-white/90 transition-all",
              socialButtonsBlockButtonText: "text-white/90",
              dividerLine: "bg-white/[0.12]",
              dividerText: "text-white/40",
              formFieldLabel: "text-white/70",
              formFieldInput:
                "!bg-white/[0.08] border border-white/[0.15] text-white placeholder:text-white/30 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30",
              formButtonPrimary:
                "bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25",
              footerActionLink: "text-blue-400 hover:text-blue-300",
              footerActionText: "text-white/50",
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
