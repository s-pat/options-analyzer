// (app) route group layout — wraps all authenticated and auth-flow pages.
// ClerkProvider and MobileLayout live HERE, not in the root layout, so they
// are never loaded for public pages (/landing, /design) where no auth is needed.
// This eliminates ~350KB of Clerk SDK parse/init from unauthenticated page loads.
import { ClerkProvider } from "@clerk/nextjs";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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

          // ── Cards / containers ──────────────────────────────────────────
          card: "!bg-[#16161e] !border !border-white/20 !shadow-2xl !shadow-black/60",
          cardBox: "!bg-[#16161e] !shadow-2xl !shadow-black/60",

          // ── Sign-in / sign-up ───────────────────────────────────────────
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
          formButtonReset:
            "!text-white/60 hover:!text-white hover:!bg-white/[0.07] transition-all",
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

          // ── UserButton popover ──────────────────────────────────────────
          userButtonAvatarBox: "w-7 h-7",
          userButtonPopoverCard: "!bg-[#16161e] !border !border-white/20",
          userButtonPopoverActionButton: "!text-white/80 hover:!bg-white/10",
          userButtonPopoverActionButtonText: "!text-white/80",
          userButtonPopoverFooter: "!hidden",

          // ── UserProfile "Manage Account" ────────────────────────────────
          // Left nav sidebar
          navbar: "!bg-[#111118] !border-r !border-white/[0.08]",
          navbarButton:
            "!text-white/70 hover:!text-white hover:!bg-white/[0.07] [&.cl-active]:!text-white [&.cl-active]:!bg-white/[0.07]",
          navbarButtonIcon: "!text-white/50",

          // Page content area
          pageScrollBox: "!bg-[#16161e]",
          page: "!bg-[#16161e]",

          // Section titles and body text (the main visibility problem)
          profileSectionTitle:
            "!border-b !border-white/[0.08]",
          profileSectionTitleText:
            "!text-white !font-semibold",
          profileSectionContent: "!text-white/80",
          profileSectionPrimaryButton:
            "!text-blue-400 hover:!text-blue-300 hover:!bg-blue-500/10 !border !border-blue-500/20 transition-all",

          // User preview block (name + email row)
          userPreviewMainIdentifier: "!text-white !font-semibold",
          userPreviewSecondaryIdentifier: "!text-white/55",
          userPreviewAvatarBox: "!border !border-white/10",

          // Accordion items (e.g. "Connected accounts", "Active devices")
          accordionTriggerButton:
            "!text-white/80 hover:!text-white hover:!bg-white/[0.04]",
          accordionContent: "!text-white/70",

          // Breadcrumb navigation
          breadcrumbsItem: "!text-white/50",
          breadcrumbsItemDivider: "!text-white/25",

          // "Active" / "Connected" / "Verified" badges
          badge:
            "!bg-green-500/10 !text-green-400 !border !border-green-500/20",

          // Destructive / danger zone text
          profileSectionDangerZone:
            "!border !border-red-500/20 !rounded-xl",
        },
      }}
    >
      <MobileLayout>{children}</MobileLayout>
    </ClerkProvider>
  );
}
