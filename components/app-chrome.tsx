"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { MobileFloatingNav } from "@/components/mobile-floating-nav";
import { ChatWidget } from "@/components/chatbot/chat-widget";

// Test-taking and active practice sessions are timed, focused tasks — the
// global nav/footer are just extra chrome eating vertical space (worse on
// mobile) and a way to accidentally navigate away mid-test. Both pages
// already have their own header (timer, progress, submit) and navigator,
// so nothing gets lost by hiding the site-wide chrome here.
function isFocusMode(pathname: string | null) {
  if (!pathname) return false;
  return pathname.startsWith("/test/") || pathname === "/practice/run";
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isFocusMode(pathname)) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Extra scroll room so the fixed bottom nav never permanently covers
          the last bit of Footer content once the page is scrolled to the end. */}
      <div className="h-24 md:hidden" />
      <MobileFloatingNav />
      <ChatWidget />
    </>
  );
}
