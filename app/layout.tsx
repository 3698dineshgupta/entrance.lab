import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";
import { NO_FLASH_SCRIPT } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

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

// Explicit instead of relying on Next's implicit default — some mobile
// browsers behave inconsistently without a declared viewport, which showed
// up as the page visibly zooming in/out on its own. Pinch-zoom stays
// available (maximumScale 5) for accessibility; see globals.css for the
// separate touch-action fix for accidental double-tap zoom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
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
