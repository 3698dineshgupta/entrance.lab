import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";
import { NO_FLASH_SCRIPT } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.entrancelab.in.net"),
  title: {
    default: "EntranceLab — IOE & CEE Mock Tests for Nepal",
    template: "%s · EntranceLab",
  },
  description:
    "Practise realistic IOE Engineering Entrance and CEE Medical Entrance mock tests. Instant scoring, subject-wise analytics, and detailed explanations.",
  keywords: ["IOE", "CEE", "Nepal", "Engineering Entrance", "Medical Entrance", "Mock Test", "MBBS", "BE"],
  openGraph: {
    title: "EntranceLab — Prepare Smarter. Score Higher.",
    description: "IOE and CEE mock tests for Nepalese students.",
    type: "website",
  },
};

import { Providers } from "@/components/providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved/system theme class before first paint — avoids
            a light->dark (or vice versa) flash on load. Must run before
            hydration, so this is the one case that needs beforeInteractive. */}
        <Script id="theme-no-flash" strategy="beforeInteractive">
          {NO_FLASH_SCRIPT}
        </Script>
      </head>
      <body className="font-sans min-h-screen flex flex-col" suppressHydrationWarning>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
