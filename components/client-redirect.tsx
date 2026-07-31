"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-sm text-muted-foreground animate-pulse">Redirecting...</div>
    </div>
  );
}
