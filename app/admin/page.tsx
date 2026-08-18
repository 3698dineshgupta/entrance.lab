"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users, Upload, BarChart2, FileText, Trash2, Shield,
  RefreshCw, Search, ChevronDown, ChevronUp, Clock, Trophy, AlertCircle, MessagesSquare, Check,
  ShoppingBag, X, ImageOff, ShieldAlert,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  _count: { attempts: number };
  attempts: {
    id: string;
    submittedAt: string;
    durationSeconds: number;
    testSet: { title: string; exam: string };
  }[];
};

type RequestRecord = {
  id: string;
  name: string;
  whatsapp: string;
  message: string;
  status: "pending" | "fulfilled";
  createdAt: string;
  user: { email: string } | null;
};

type MerchandiseReport = {
  id: string;
  reason: string;
  reporterContact: string | null;
  createdAt: string;
};

type MerchandiseRecord = {
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
  user: { name: string | null; email: string };
  reports: MerchandiseReport[];
};

type Tab = "users" | "upload" | "overview" | "requests" | "merchandise";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [uploadFormat, setUploadFormat] = useState<"standard" | "subtopic">("standard");
  const [uploadExam, setUploadExam] = useState<"AUTO" | "IOE" | "CEE">("AUTO");
  const [uploadSubject, setUploadSubject] = useState("");
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [merchandise, setMerchandise] = useState<MerchandiseRecord[]>([]);
  const [loadingMerchandise, setLoadingMerchandise] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/admin/requests");
      if (res.ok) setRequests(await res.json());
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const toggleRequestStatus = async (id: string, current: "pending" | "fulfilled") => {
    const next = current === "pending" ? "fulfilled" : "pending";
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
  };

  const fetchMerchandise = useCallback(async () => {
    setLoadingMerchandise(true);
    try {
      const res = await fetch("/api/admin/merchandise");
      if (res.ok) setMerchandise(await res.json());
    } finally {
      setLoadingMerchandise(false);
    }
  }, []);

  const decideMerchandise = async (id: string, decision: "approved" | "rejected") => {
    setMerchandise((prev) => prev.map((m) => (m.id === id ? { ...m, status: decision } : m)));
    await fetch("/api/admin/merchandise", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: decision }),
    });
  };

  const deleteMerchandise = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setMerchandise((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/admin/merchandise/${id}`, { method: "DELETE" });
  };

  useEffect(() => {
    if (tab === "users" || tab === "overview") fetchUsers();
    if (tab === "requests" || tab === "overview") fetchRequests();
    if (tab === "merchandise" || tab === "overview") fetchMerchandise();
  }, [tab, fetchUsers, fetchRequests, fetchMerchandise]);

  if (status === "loading") return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-600 dark:border-cyan-400 border-t-transparent" />
    </div>
  );
  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="container py-24 text-center">
        <AlertCircle className="h-12 w-12 text-red-700 dark:text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">This area is restricted to administrators only.</p>
      </div>
    );
  }

  const parseRow = (row: any, topicOverride: string | null) => {
    const options = [
      String(row["Option A"] || "A"),
      String(row["Option B"] || "B"),
      String(row["Option C"] || "C"),
      String(row["Option D"] || "D"),
    ];
    const answerRaw = String(row["Answer"] || row["Correct Option"] || row["Correct"] || "A").trim();
    let correctIndex = options.findIndex(o => o.trim() === answerRaw);
    if (correctIndex === -1) {
      // Fallback for minor text drift between the Answer cell and its option
      correctIndex = options.findIndex(o => o.trim().length > 0 && (answerRaw.startsWith(o.trim()) || o.trim().startsWith(answerRaw)));
    }
    if (correctIndex === -1) {
      if (answerRaw.toUpperCase().startsWith("A")) correctIndex = 0;
      else if (answerRaw.toUpperCase().startsWith("B")) correctIndex = 1;
      else if (answerRaw.toUpperCase().startsWith("C")) correctIndex = 2;
      else if (answerRaw.toUpperCase().startsWith("D")) correctIndex = 3;
      else correctIndex = 0;
    }
    return {
      subject: row["Subject"] || uploadSubject || "Physics",
      topic: topicOverride ?? row["Topic"] ?? null,
      subtopic: row["Sub-Topic"] ?? row["Subtopic"] ?? null,
      text: row["Question"] || "Missing question",
      options,
      correctIndex,
      explanation: row["Explanation"] || null,
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("Parsing file...");
    setMessageType("info");

    try {
      // Loaded on demand rather than at module scope — xlsx is a sizeable
      // dependency that every admin visit would otherwise pull in even if
      // this upload feature is never used.
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      let questions: any[];
      if (uploadFormat === "subtopic") {
        if (!uploadSubject.trim()) throw new Error("Subject is required for subtopic-wise uploads");
        questions = [];
        for (const sheetName of workbook.SheetNames) {
          const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          for (const row of rows) {
            if (!row["Question"]) continue; // bare Sub-Topic divider row
            questions.push(parseRow(row, sheetName));
          }
        }
      } else {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);
        questions = rows.map((row) => parseRow(row, null));
      }
      setMessage(`Parsed ${questions.length} questions. Uploading...`);

      const examGuess = uploadExam !== "AUTO" ? uploadExam : (file.name.toUpperCase().includes("IOE") ? "IOE" : "CEE");
      const title = uploadFormat === "subtopic"
        ? `${examGuess} ${uploadSubject.trim()} — Subtopic Practice Bank`
        : file.name.replace(/\.[^/.]+$/, "");
      const payload = {
        title,
        exam: examGuess,
        mode: uploadFormat === "subtopic" ? "subject" : "full",
        subject: uploadFormat === "subtopic" ? uploadSubject.trim() : undefined,
        difficulty: "mixed",
        durationMinutes: uploadFormat === "subtopic" ? 0 : (examGuess === "CEE" ? 180 : 120),
        // Subtopic-wise banks are practice-only content, not timed mock tests —
        // keep them out of the Mock Tests listing.
        isPublished: uploadFormat !== "subtopic",
        questions,
      };

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage(`✓ Uploaded "${payload.title}" with ${questions.length} questions!`);
        setMessageType("success");
      } else {
        setMessage(`✗ Error: ${result.error}`);
        setMessageType("error");
      }
    } catch (err: any) {
      setMessage(`✗ Parse error: ${err.message}`);
      setMessageType("error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAttempts = users.reduce((s, u) => s + u._count.attempts, 0);
  const activeUsers = users.filter(u => u._count.attempts > 0).length;

  return (
    <div className="container py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 font-medium">Administration</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Logged in as <span className="text-cyan-700 dark:text-cyan-400">{session.user.email}</span></p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg border border-slate-200 bg-slate-900/[0.02] dark:border-white/10 dark:bg-white/[0.02] flex-wrap">
          {(["overview", "users", "requests", "merchandise", "upload"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm rounded-md capitalize transition inline-flex items-center gap-1.5",
                tab === t ? "bg-white shadow-sm text-foreground font-medium dark:bg-white/[0.08] dark:shadow-none" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "overview" ? "Overview" : t === "users" ? "Users" : t === "requests" ? "Requests" : t === "merchandise" ? "Merchandise" : "Upload Test"}
              {t === "requests" && requests.some(r => r.status === "pending") && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] px-1">
                  {requests.filter(r => r.status === "pending").length}
                </span>
              )}
              {t === "merchandise" && merchandise.some(m => m.status === "pending") && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] px-1">
                  {merchandise.filter(m => m.status === "pending").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={users.length} color="text-blue-600 dark:text-blue-400" />
            <StatCard icon={<BarChart2 className="h-5 w-5" />} label="Active Users" value={activeUsers} color="text-green-600 dark:text-green-400" />
            <StatCard icon={<Trophy className="h-5 w-5" />} label="Total Attempts" value={totalAttempts} color="text-orange-600 dark:text-orange-400" />
            <StatCard icon={<FileText className="h-5 w-5" />} label="Avg Attempts/User" value={users.length > 0 ? +(totalAttempts / users.length).toFixed(1) : 0} color="text-purple-600 dark:text-purple-400" />
          </div>

          <Card className="p-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-cyan-700 dark:text-cyan-400" /> Recent Registrations
            </h2>
            <div className="space-y-2">
              {users.slice(0, 8).map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{u.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400">{u._count.attempts} attempts</span>
                    <p className="text-[10px] text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No users yet.</p>}
            </div>
          </Card>
        </div>
      )}

      {/* USERS TAB */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 dark:bg-white/[0.03] dark:border-white/10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loadingUsers}>
              <RefreshCw className={cn("h-4 w-4", loadingUsers && "animate-spin")} /> Refresh
            </Button>
            <span className="text-xs text-muted-foreground">{filtered.length} users</span>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-slate-200 bg-slate-900/[0.01] dark:border-white/[0.06] dark:bg-white/[0.01]">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Joined</th>
                    <th className="text-center px-4 py-3">Attempts</th>
                    <th className="text-center px-4 py-3">Activity</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filtered.map(u => (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-cyan-800 dark:text-cyan-300 border border-slate-200 dark:border-white/10 shrink-0">
                              {(u.name || u.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{u.name || <span className="text-muted-foreground italic">No name</span>}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full text-xs font-semibold",
                            u._count.attempts === 0 ? "bg-slate-100 text-muted-foreground dark:bg-white/[0.06]" :
                              u._count.attempts >= 5 ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400"
                          )}>
                            {u._count.attempts}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u._count.attempts > 0
                            ? <span className="text-xs text-green-700 dark:text-green-400">Active</span>
                            : <span className="text-xs text-muted-foreground">Inactive</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.attempts.length > 0 && (
                              <button
                                onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                className="inline-flex items-center gap-1 text-xs text-cyan-700 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition"
                              >
                                {expandedUser === u.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                Details
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedUser === u.id && (
                        <tr key={`${u.id}-expanded`}>
                          <td colSpan={5} className="px-4 py-0 bg-slate-900/[0.01] dark:bg-white/[0.01]">
                            <div className="py-3 space-y-2 border-t border-slate-200 dark:border-white/[0.06]">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent Test Attempts</p>
                              {u.attempts.map(a => (
                                <div key={a.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-900/[0.02] border border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.04]">
                                  <div className="flex items-center gap-2">
                                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", a.testSet.exam === "CEE" ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400" : "bg-orange-500/20 text-orange-700 dark:text-orange-400")}>
                                      {a.testSet.exam}
                                    </span>
                                    <span className="font-medium">{a.testSet.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(a.durationSeconds)}</span>
                                    <span>{new Date(a.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {search ? "No users match your search." : "No users registered yet."}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* REQUESTS TAB */}
      {tab === "requests" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <MessagesSquare className="h-4 w-4 text-cyan-700 dark:text-cyan-400" /> Material Requests
            </h2>
            <Button size="sm" variant="secondary" onClick={fetchRequests} disabled={loadingRequests}>
              <RefreshCw className={cn("h-3.5 w-3.5", loadingRequests && "animate-spin")} /> Refresh
            </Button>
          </div>

          {loadingRequests && requests.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No requests submitted yet.</div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-xl border p-4",
                    r.status === "fulfilled" ? "border-slate-200 bg-slate-900/[0.01] opacity-60 dark:border-white/[0.06] dark:bg-white/[0.01]" : "border-slate-200 bg-slate-900/[0.02] dark:border-white/10 dark:bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{r.name}</p>
                        {r.user?.email && (
                          <span className="text-[11px] text-muted-foreground">({r.user.email})</span>
                        )}
                        <span className={cn(
                          "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
                          r.status === "fulfilled" ? "border-green-400/20 text-green-700 dark:text-green-400 bg-green-500/[0.06]" : "border-cyan-400/20 text-cyan-700 dark:text-cyan-300 bg-cyan-500/[0.06]"
                        )}>
                          {r.status}
                        </span>
                      </div>
                      <a
                        href={`https://wa.me/${r.whatsapp.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-700 dark:text-green-400 hover:underline mt-0.5 inline-block"
                      >
                        {r.whatsapp}
                      </a>
                      <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">{r.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={r.status === "fulfilled" ? "secondary" : "default"}
                      onClick={() => toggleRequestStatus(r.id, r.status)}
                      className="shrink-0"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {r.status === "fulfilled" ? "Mark pending" : "Mark fulfilled"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* MERCHANDISE TAB */}
      {tab === "merchandise" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-cyan-700 dark:text-cyan-400" /> Merchandise Listings
            </h2>
            <Button size="sm" variant="secondary" onClick={fetchMerchandise} disabled={loadingMerchandise}>
              <RefreshCw className={cn("h-3.5 w-3.5", loadingMerchandise && "animate-spin")} /> Refresh
            </Button>
          </div>

          {loadingMerchandise && merchandise.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading listings...</div>
          ) : merchandise.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No listings submitted yet.</div>
          ) : (
            <div className="space-y-3">
              {merchandise.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-xl border p-4",
                    m.reports.length > 0 ? "border-red-400/25 bg-red-500/[0.03]"
                      : m.status === "rejected" || m.status === "sold" ? "border-slate-200 bg-slate-900/[0.01] opacity-60 dark:border-white/[0.06] dark:bg-white/[0.01]"
                      : "border-slate-200 bg-slate-900/[0.02] dark:border-white/10 dark:bg-white/[0.02]"
                  )}
                >
                  <div className="flex gap-4">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06] shrink-0">
                      {m.imageUrl ? (
                        <Image src={m.imageUrl} alt={m.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-5 w-5" /></div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{m.title}</p>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
                          m.status === "approved" ? "border-green-400/20 text-green-700 dark:text-green-400 bg-green-500/[0.06]"
                            : m.status === "pending" ? "border-cyan-400/20 text-cyan-700 dark:text-cyan-300 bg-cyan-500/[0.06]"
                            : m.status === "sold" ? "border-slate-200 text-muted-foreground bg-slate-100 dark:border-white/15 dark:bg-white/[0.04]"
                            : "border-red-400/20 text-red-700 dark:text-red-400 bg-red-500/[0.06]"
                        )}>
                          {m.status}
                        </span>
                        {m.reports.length > 0 && (
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-red-400/30 text-red-700 dark:text-red-400 bg-red-500/10 flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> {m.reports.length} report{m.reports.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Rs. {m.price.toLocaleString("en-IN")} · {m.category}</p>
                      <p className="text-xs text-foreground/80 mt-1.5 line-clamp-2">{m.description}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                        <span>Posted by <span className="text-foreground">{m.user.name || "—"}</span> ({m.user.email})</span>
                        <a href={`https://wa.me/${m.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-700 dark:text-green-400 hover:underline">
                          {m.whatsapp}
                        </a>
                        <span>{new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {m.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => decideMerchandise(m.id, "approved")}>
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => decideMerchandise(m.id, "rejected")}>
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => deleteMerchandise(m.id, m.title)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>

                  {m.reports.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-red-400/15 space-y-2">
                      {m.reports.map((r) => (
                        <div key={r.id} className="text-xs">
                          <p className="text-red-700 dark:text-red-300">{r.reason}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {r.reporterContact ? `Contact: ${r.reporterContact} · ` : ""}
                            {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* UPLOAD TAB */}
      {tab === "upload" && (
        <Card className="p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Upload Question Set</h2>
              <p className="text-xs text-muted-foreground">Excel file (.xls / .xlsx)</p>
            </div>
          </div>

          {/* Format selector */}
          <div className="mt-6 flex gap-1 p-1 rounded-lg border border-slate-200 bg-slate-900/[0.02] w-fit dark:border-white/10 dark:bg-white/[0.02]">
            {([
              { key: "standard", label: "Standard (single sheet)" },
              { key: "subtopic", label: "Subtopic-wise (one sheet per topic)" },
            ] as { key: "standard" | "subtopic"; label: string }[]).map((f) => (
              <button
                key={f.key}
                onClick={() => setUploadFormat(f.key)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition",
                  uploadFormat === f.key ? "bg-white shadow-sm text-foreground dark:bg-white/[0.08] dark:shadow-none" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Exam</label>
              <select
                value={uploadExam}
                onChange={(e) => setUploadExam(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400/50 dark:bg-white/[0.03] dark:border-white/10"
              >
                <option value="AUTO">Auto-detect from filename</option>
                <option value="IOE">IOE</option>
                <option value="CEE">CEE</option>
              </select>
            </div>
            {uploadFormat === "subtopic" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Subject</label>
                <input
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  placeholder="e.g. Physics"
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400/50 w-40 dark:bg-white/[0.03] dark:border-white/10"
                />
              </div>
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-900/[0.02] border border-slate-200 text-xs text-muted-foreground space-y-1 mb-6 dark:bg-white/[0.02] dark:border-white/[0.06]">
            {uploadFormat === "standard" ? (
              <>
                <p className="font-medium text-foreground text-sm mb-2">Required columns:</p>
                <p>• <span className="font-mono text-cyan-700 dark:text-cyan-400">Subject</span> — Physics, Chemistry, Botany, Zoology, MAT, Mathematics, English</p>
                <p>• <span className="font-mono text-cyan-700 dark:text-cyan-400">Question</span> — The full question text</p>
                <p>• <span className="font-mono text-cyan-700 dark:text-cyan-400">Option A / B / C / D</span> — Answer choices</p>
                <p>• <span className="font-mono text-cyan-700 dark:text-cyan-400">Answer</span> or <span className="font-mono text-cyan-700 dark:text-cyan-400">Correct Option</span> — The correct answer text or letter (A/B/C/D)</p>
                <p>• <span className="font-mono text-cyan-700 dark:text-cyan-400">Topic</span> <span className="opacity-70">(optional)</span> — Enables topic-wise practice mode for these questions</p>
                <p>• <span className="font-mono text-cyan-700 dark:text-cyan-400">Explanation</span> <span className="opacity-70">(optional)</span> — Shown to students after they answer</p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground text-sm mb-2">Expected format:</p>
                <p>• One <span className="font-mono text-cyan-700 dark:text-cyan-400">sheet per topic</span> — the sheet name becomes the topic (e.g. "Mechanics")</p>
                <p>• <span className="font-mono text-cyan-700 dark:text-cyan-400">Sub-Topic</span> — groups rows into a subtopic (e.g. "1.1 Kinematics")</p>
                <p>• <span className="font-mono text-cyan-700 dark:text-cyan-400">Question</span>, <span className="font-mono text-cyan-700 dark:text-cyan-400">Option A-D</span>, <span className="font-mono text-cyan-700 dark:text-cyan-400">Answer</span>, <span className="font-mono text-cyan-700 dark:text-cyan-400">Explanation</span> — same as standard format</p>
                <p>• Uploaded as an unpublished practice bank (won't appear in Mock Tests)</p>
              </>
            )}
            <p className="mt-2 text-[11px] text-cyan-700/80 dark:text-cyan-400/70">💡 The exam type is auto-detected from the filename unless you pick one above.</p>
          </div>

          <label className={cn(
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition",
            uploading
              ? "border-slate-200 opacity-50 cursor-not-allowed dark:border-white/10"
              : "border-slate-300 hover:border-cyan-400/40 hover:bg-cyan-500/[0.02] dark:border-white/20"
          )}>
            <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center dark:bg-white/[0.04] dark:border-white/10">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to select or drop your Excel file here"}
            </p>
            <input
              type="file"
              accept=".xls,.xlsx"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {message && (
            <div className={cn(
              "mt-4 p-4 rounded-xl text-sm border",
              messageType === "success" ? "bg-green-500/10 border-green-400/20 text-green-700 dark:text-green-300" :
              messageType === "error" ? "bg-red-500/10 border-red-400/20 text-red-700 dark:text-red-300" :
              "bg-slate-900/[0.03] border-slate-200 text-muted-foreground dark:bg-white/[0.03] dark:border-white/10"
            )}>
              {message}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card className="p-5">
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/[0.03] border border-slate-200 dark:bg-white/[0.04] dark:border-white/10", color)}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  );
}
