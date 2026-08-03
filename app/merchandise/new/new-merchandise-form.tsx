"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, CheckCircle2 } from "lucide-react";
import { MERCHANDISE_CATEGORIES } from "@/lib/merchandise";

export function NewMerchandiseForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>(MERCHANDISE_CATEGORIES[0]);
  const [whatsapp, setWhatsapp] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/merchandise/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error || "Image upload failed.");
          setLoading(false);
          return;
        }
        imageUrl = uploadData.url;
      }

      const res = await fetch("/api/merchandise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          whatsapp,
          imageUrl,
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
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="container py-16 flex justify-center">
        <Card className="w-full max-w-md p-7 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 border border-green-400/20 mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-400" />
          </div>
          <h1 className="text-xl font-semibold">Listing submitted</h1>
          <p className="text-sm text-muted-foreground mt-2">
            It's been sent for review — it'll appear on the Merchandise page as soon as it's approved.
          </p>
          <div className="mt-6 flex gap-2 justify-center">
            <Button asChild><Link href="/merchandise">Back to Merchandise</Link></Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDone(false); setTitle(""); setDescription(""); setPrice(""); setWhatsapp("");
                setImageFile(null); setImagePreview(null);
              }}
            >
              Post another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 flex justify-center">
      <Card className="w-full max-w-lg p-7">
        <h1 className="text-2xl font-semibold tracking-tight">Post an ad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selling books, a calculator, or notes? List it here — every ad is reviewed before it goes live.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{error}</div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. IOE Physics reference books (set of 3)" required maxLength={120} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (Rs.)</Label>
              <Input id="price" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {MERCHANDISE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, edition, why you're selling..." rows={4} required maxLength={2000} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp number</Label>
            <Input id="whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="98XXXXXXXX" required />
            <p className="text-[11px] text-muted-foreground">Buyers will message you here directly.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Photo (optional)</Label>
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-lg border border-dashed border-white/15 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-white/30 hover:text-foreground transition"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Add a photo (JPEG, PNG, or WebP · up to 5MB)</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Submitting..." : "Submit for review"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
