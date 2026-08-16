"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Plus, ShoppingBag, ImageOff, ShieldAlert, Flag, CheckCircle2, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WhatsAppInput } from "@/components/whatsapp-input";
import { cn } from "@/lib/utils";
import { MERCHANDISE_CATEGORIES } from "@/lib/merchandise";
import { toNepaliWhatsapp } from "@/lib/phone";

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
  const [reportTarget, setReportTarget] = useState<Listing | null>(null);
  const filtered = category === "All" ? listings : listings.filter((l) => l.category === category);

  return (
    <div className="container py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 font-medium">Merchandise</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Buy &amp; sell study material</h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-xl">
            Books, calculators, and notes from other IOE/CEE aspirants. Contact sellers directly on WhatsApp — every listing is reviewed before it goes live.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="secondary" size="lg">
            <Link href="/merchandise/mine"><ListChecks className="h-4 w-4" /> My listings</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/merchandise/new"><Plus className="h-4 w-4" /> Post an ad</Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-500/[0.06] p-3 max-w-2xl">
        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
          We just list ads — we don't verify sellers or handle payment. Inspect the item and confirm everything's genuine before you pay. See something suspicious? Use the Report link on that listing.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["All", ...MERCHANDISE_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-medium rounded-full border transition",
              category === c
                ? "bg-cyan-50 border-cyan-400/40 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
                : "border-slate-200 text-muted-foreground hover:text-foreground hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
          <ShoppingBag className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {listings.length === 0 ? "No listings yet — be the first to post one." : "No listings in this category yet."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} onReport={() => setReportTarget(l)} />
          ))}
        </div>
      )}

      <ReportDialog listing={reportTarget} onOpenChange={(v) => !v && setReportTarget(null)} />
    </div>
  );
}

function ListingCard({ listing, onReport }: { listing: Listing; onReport: () => void }) {
  const sold = listing.status === "sold";
  const waMessage = encodeURIComponent(`Hi, I'm interested in your "${listing.title}" listing on EntranceLab.`);
  const waHref = `https://wa.me/${listing.whatsapp.replace(/[^\d]/g, "")}?text=${waMessage}`;

  return (
    <Card className={cn("overflow-hidden flex flex-col", sold && "opacity-70")}>
      <div className="relative aspect-[4/3] bg-slate-100 border-b border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06]">
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{listing.title}</h3>
          <button
            onClick={onReport}
            className="shrink-0 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition mt-0.5"
            aria-label="Report this listing"
          >
            <Flag className="h-3 w-3" /> Report
          </button>
        </div>
        <p className="text-cyan-700 dark:text-cyan-400 font-semibold mt-1.5">Rs. {listing.price.toLocaleString("en-IN")}</p>
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

function ReportDialog({ listing, onOpenChange }: { listing: Listing | null; onOpenChange: (v: boolean) => void }) {
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => { setReason(""); setContact(""); setError(""); setDone(false); };

  const submit = async () => {
    if (!listing) return;
    if (!reason.trim()) { setError("Describe what happened."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/merchandise/${listing.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          reporterContact: contact ? toNepaliWhatsapp(contact) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!listing} onOpenChange={(v) => { if (!v) { onOpenChange(false); setTimeout(reset, 200); } }}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="py-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 border border-green-400/20 mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-700 dark:text-green-400" />
            </div>
            <p className="font-medium">Report received</p>
            <p className="text-sm text-muted-foreground mt-1">Our team will look into it.</p>
            <Button className="mt-5" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report "{listing?.title}"</DialogTitle>
              <DialogDescription>Tell us what happened — fake item, no response, asked for payment upfront, etc.</DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400 border border-red-500/20">{error}</div>
            )}

            <div className="space-y-4">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What happened?"
                rows={4}
                maxLength={1000}
              />
              <WhatsAppInput
                id="report-contact"
                value={contact}
                onChange={setContact}
                hint="Optional — only if you're OK with us following up."
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={submit} disabled={loading}>{loading ? "Sending..." : "Submit report"}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
