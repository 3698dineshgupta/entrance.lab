"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Plus, ShoppingBag, ImageOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MERCHANDISE_CATEGORIES } from "@/lib/merchandise";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  whatsapp: string;
  imageUrl: string | null;
  status: "approved" | "sold";
  createdAt: string;
}

export function MerchandiseBrowser({ listings }: { listings: Listing[] }) {
  const [category, setCategory] = useState<string>("All");
  const filtered = category === "All" ? listings : listings.filter((l) => l.category === category);

  return (
    <div className="container py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Merchandise</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Buy &amp; sell study material</h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-xl">
            Books, calculators, and notes from other IOE/CEE aspirants. Contact sellers directly on WhatsApp — every listing is reviewed before it goes live.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/merchandise/new"><Plus className="h-4 w-4" /> Post an ad</Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["All", ...MERCHANDISE_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-medium rounded-full border transition",
              category === c
                ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-300"
                : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 text-center py-20 rounded-2xl border border-dashed border-white/10">
          <ShoppingBag className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {listings.length === 0 ? "No listings yet — be the first to post one." : "No listings in this category yet."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const sold = listing.status === "sold";
  const waMessage = encodeURIComponent(`Hi, I'm interested in your "${listing.title}" listing on EntranceLab.`);
  const waHref = `https://wa.me/${listing.whatsapp.replace(/[^\d]/g, "")}?text=${waMessage}`;

  return (
    <Card className={cn("overflow-hidden flex flex-col", sold && "opacity-70")}>
      <div className="relative aspect-[4/3] bg-white/[0.03] border-b border-white/[0.06]">
        {listing.imageUrl ? (
          <Image src={listing.imageUrl} alt={listing.title} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-sm font-semibold uppercase tracking-wider text-white px-3 py-1 rounded-full border border-white/40">Sold</span>
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur">
          {listing.category}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{listing.title}</h3>
        <p className="text-cyan-400 font-semibold mt-1.5">Rs. {listing.price.toLocaleString("en-IN")}</p>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 flex-1">{listing.description}</p>

        {sold ? (
          <Button disabled variant="secondary" size="sm" className="mt-4 w-full">Sold</Button>
        ) : (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg h-9 px-3 text-sm font-medium text-white bg-gradient-to-b from-green-500 to-green-600 shadow-lg shadow-green-500/20 hover:from-green-400 hover:to-green-500 transition"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Contact on WhatsApp
          </a>
        )}
      </div>
    </Card>
  );
}
