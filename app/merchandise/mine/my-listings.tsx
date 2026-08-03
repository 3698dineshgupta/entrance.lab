"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, ImageOff, Clock, CheckCircle2, XCircle, Tag } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  whatsapp: string;
  imageUrl: string | null;
  status: "pending" | "approved" | "rejected" | "sold";
  soldAt: string | null;
  createdAt: string;
}

const STATUS_META: Record<Listing["status"], { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pending review", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-400/20", icon: Clock },
  approved: { label: "Live", color: "text-green-400", bg: "bg-green-500/10 border-green-400/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10 border-red-400/20", icon: XCircle },
  sold: { label: "Sold", color: "text-muted-foreground", bg: "bg-white/[0.04] border-white/10", icon: Tag },
};

export function MyListings({ listings: initial }: { listings: Listing[] }) {
  const [listings, setListings] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);

  const markSold = async (id: string) => {
    setPending(id);
    const res = await fetch(`/api/merchandise/${id}/sold`, { method: "PATCH" });
    if (res.ok) {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l)));
    }
    setPending(null);
  };

  return (
    <div className="container py-12 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Merchandise</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">My listings</h1>
        </div>
        <Button asChild size="sm"><Link href="/merchandise/new"><Plus className="h-3.5 w-3.5" /> Post an ad</Link></Button>
      </div>

      {listings.length === 0 ? (
        <div className="mt-10 text-center py-20 rounded-2xl border border-dashed border-white/10">
          <p className="text-sm text-muted-foreground">You haven't posted anything yet.</p>
          <Button asChild className="mt-5" size="sm"><Link href="/merchandise/new">Post your first ad</Link></Button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {listings.map((l) => {
            const meta = STATUS_META[l.status];
            const Icon = meta.icon;
            return (
              <Card key={l.id} className="p-4 flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-white/[0.03] border border-white/[0.06] shrink-0">
                  {l.imageUrl ? (
                    <Image src={l.imageUrl} alt={l.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-5 w-5" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Rs. {l.price.toLocaleString("en-IN")} · {l.category}</p>
                  <span className={cn("mt-1.5 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border", meta.bg, meta.color)}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                </div>
                {l.status === "approved" && (
                  <Button size="sm" variant="secondary" onClick={() => markSold(l.id)} disabled={pending === l.id} className="shrink-0">
                    {pending === l.id ? "Marking..." : "Mark as sold"}
                  </Button>
                )}
                {l.status === "sold" && (
                  <span className="text-[11px] text-muted-foreground shrink-0">Removes automatically after 48h</span>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
