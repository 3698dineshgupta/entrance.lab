"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { AlertCircle, ArrowRight, BookOpen, ClipboardList, Loader2, Mail, Lock, TrendingUp, User, UserPlus } from "lucide-react";
import { SpiderAuthScene } from "@/components/auth/spider-auth-scene";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { useSpiderAuth } from "@/components/auth/spider-scene-context";

const FEATURES = [
  { icon: <ClipboardList className="h-[18px] w-[18px]" />, title: "Full-Length Mock Tests", subtitle: "IOE & CEE, timed and realistic" },
  { icon: <BookOpen className="h-[18px] w-[18px]" />, title: "Subject-Wise Practice", subtitle: "Drill any subject, any time" },
  { icon: <TrendingUp className="h-[18px] w-[18px]" />, title: "Smart Analytics", subtitle: "Track your performance over time" },
];

export default function RegisterPage() {
  return (
    <SpiderAuthScene
      brandHeading="Join EntranceLab"
      brandDescription="Create your account to start practicing for IOE and CEE with realistic mock tests, instant scoring, and detailed analytics."
      features={FEATURES}
    >
      <AuthCard
        title="Sign Up"
        subtitle="Join thousands preparing for IOE and CEE."
        successTitle="Welcome to EntranceLab 🎓"
        successMessage="Your account is ready — taking you in…"
      >
        <RegisterForm />
      </AuthCard>
    </SpiderAuthScene>
  );
}

function RegisterForm() {
  const { setSubmitStage, setStatusText, statusText, submitStage, triggerError } = useSpiderAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitStage("working");
    setStatusText("Building your account…");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        setSubmitStage("idle");
        setStatusText(null);
        triggerError();
        return;
      }

      setStatusText("Connecting your profile…");

      // Auto-login after registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.ok) {
        setStatusText("Almost ready…");
        // A brief readable beat before the success state — auth has already
        // succeeded by this point, so this doesn't delay authentication,
        // just paces the celebration instead of jump-cutting to it.
        await new Promise((r) => setTimeout(r, 350));
        setSubmitStage("success");
        setStatusText(null);
        // Hard navigation — see app/login/page.tsx for why router.push()+
        // router.refresh() is unreliable right after signIn().
        setTimeout(() => { window.location.href = "/mock-tests"; }, 900);
      } else {
        setSubmitStage("idle");
        setStatusText(null);
        window.location.href = "/login";
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      setSubmitStage("idle");
      setStatusText(null);
      triggerError();
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-200 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <AuthField
        name="name"
        label="Full Name"
        autoComplete="name"
        icon={<User className="h-4 w-4" />}
        value={name}
        onChange={setName}
        invalid={!!error}
        required
        autoFocus
      />
      <AuthField
        name="email"
        label="Email Address"
        type="email"
        inputMode="email"
        autoComplete="email"
        icon={<Mail className="h-4 w-4" />}
        value={email}
        onChange={setEmail}
        invalid={!!error}
        required
      />
      <AuthField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        icon={<Lock className="h-4 w-4" />}
        value={password}
        onChange={setPassword}
        invalid={!!error}
        required
        minLength={6}
      />

      <div className="space-y-2">
        <AuthSubmitButton type="submit" className="w-full rounded-xl" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Create Account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </AuthSubmitButton>
        {submitStage === "working" && statusText && (
          <p aria-live="polite" className="text-center text-xs text-blue-600 dark:text-blue-400 animate-in fade-in duration-300">
            {statusText}
          </p>
        )}
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account? <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-4">Log in</Link>
      </p>
    </form>
  );
}
