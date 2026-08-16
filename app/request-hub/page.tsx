"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, MessagesSquare } from "lucide-react";
import { WhatsAppInput } from "@/components/whatsapp-input";
import { isValidNepaliLocal, toNepaliWhatsapp } from "@/lib/phone";

export default function RequestHubPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidNepaliLocal(whatsapp)) {
      setError("Enter a valid 10-digit WhatsApp number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp: toNepaliWhatsapp(whatsapp), message }),
      });
      if (!res.ok) {
        const data = await res.json();
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
            <CheckCircle2 className="h-7 w-7 text-green-700 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-semibold">Request received</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Thanks — our team will review it and reach out on WhatsApp if we need more details.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => { setDone(false); setMessage(""); }}
          >
            Send another request
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-16 flex justify-center">
      <Card className="w-full max-w-md p-7">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/20 mb-3">
          <MessagesSquare className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Request Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Missing a subject, past paper, or question bank you need? Tell us what you're
          looking for and we'll try to add it.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </div>
          <WhatsAppInput id="whatsapp" value={whatsapp} onChange={setWhatsapp} required hint="So we can reach out if we need more details." />
          <div className="space-y-1.5">
            <Label htmlFor="message">What do you need?</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. IOE English past papers, CEE Zoology topic-wise notes..."
              rows={4}
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending..." : "Send Request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
