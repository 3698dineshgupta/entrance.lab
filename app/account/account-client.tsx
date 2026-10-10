"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, Mail, ShieldCheck, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export function AccountClient({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string;
  role: string;
}) {
  const router = useRouter();
  const isAdmin = role === "ADMIN";

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const closeDialog = () => {
    setOpen(false);
    setPassword("");
    setError(null);
  };

  const handleDelete = async () => {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      await signOut({ redirect: false });
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-medium">Account</p>
      <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Manage your account</h1>
      <p className="mt-2 text-muted-foreground text-sm">Your profile details and account controls.</p>

      <Card className="mt-8 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F6BFF] to-[#8B5CF6] text-xl font-semibold text-white">
            {(name || email || "?").trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{name || "No name set"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{email}</span>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-[#4F6BFF] shrink-0" />
                <span className="text-[#4F6BFF] dark:text-[#8FB4FF] font-medium">Admin</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-red-500/20 p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" /> Danger zone
          </CardTitle>
          <CardDescription className="mt-1">
            {isAdmin
              ? "Admin accounts can't be self-deleted here — ask another admin to demote you first, then you can delete your account."
              : "Permanently deletes your account: your mock test attempts, practice history, and merchandise listings. This can't be undone."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <Button
            variant="destructive"
            disabled={isAdmin}
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4" /> Delete my account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account and all associated data. Enter your password to confirm — this can't be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="delete-password">Password</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              placeholder="Your current password"
            />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {loading ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
