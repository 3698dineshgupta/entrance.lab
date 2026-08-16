"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { AlertCircle, ArrowRight, ClipboardList, Loader2, LogIn, Mail, Lock, TrendingUp } from "lucide-react";
import { SpiderAuthScene } from "@/components/auth/spider-auth-scene";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { useSpiderAuth } from "@/components/auth/spider-scene-context";

const FEATURES = [
  { icon: <ClipboardList className="h-[18px] w-[18px]" />, title: "Full-Length Mock Tests", subtitle: "IOE & CEE, timed and realistic" },
  { icon: <TrendingUp className="h-[18px] w-[18px]" />, title: "Smart Analytics", subtitle: "Track your performance over time" },
];

export default function LoginPage() {
  return (
    <Suspense>
      <SpiderAuthScene
        brandHeading="Welcome Back!"
        brandDescription="Continue your journey to engineering and medical entrance success. Access your dashboard, track progress, and keep practicing."
        features={FEATURES}
      >
        <AuthCard
          title="Sign In"
          subtitle="Please enter your details to access your account."
          successTitle="Signed in"
          successMessage="Taking you to your dashboard…"
        >
          <LoginForm />
        </AuthCard>
      </SpiderAuthScene>
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/mock-tests";
  const { setSubmitStage, triggerError } = useSpiderAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitStage("working");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
        setSubmitStage("idle");
        triggerError();
      } else {
        setSubmitStage("success");
        // Brief celebratory beat — auth already succeeded, this doesn't
        // delay it. Hard navigation (not router.push) so the fresh session
        // cookie is guaranteed attached — see the note this file used to
        // carry: an immediate client-side transition can race with
        // middleware reading that cookie on the next request.
        setTimeout(() => { window.location.href = callbackUrl; }, 700);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      setSubmitStage("idle");
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
        autoFocus
      />
      <AuthField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        icon={<Lock className="h-4 w-4" />}
        value={password}
        onChange={setPassword}
        invalid={!!error}
        required
      />

      <AuthSubmitButton type="submit" className="w-full rounded-xl" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" /> Sign In <ArrowRight className="h-4 w-4" />
          </>
        )}
      </AuthSubmitButton>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        New here? <Link href="/register" className="font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-4">Create an account</Link>
      </p>
    </form>
  );
}
