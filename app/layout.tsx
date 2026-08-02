import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrancelab.in.net"),
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
    <html lang="en" className={inter.variable}>
      <body className="font-sans min-h-screen flex flex-col" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
