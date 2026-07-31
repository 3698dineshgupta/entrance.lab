"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  return (
    <div className="container py-16 flex justify-center">
      <Card className="w-full max-w-md p-7">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your progress across every mock test.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => { e.preventDefault(); router.push("/dashboard"); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Your name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="At least 8 characters" required />
          </div>
          <Button type="submit" className="w-full" size="lg">Create account</Button>
        </form>

        <p className="mt-5 text-xs text-center text-muted-foreground">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
