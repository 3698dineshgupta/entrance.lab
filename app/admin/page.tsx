"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users, Upload, BarChart2, FileText, Trash2, Shield,
  RefreshCw, Search, ChevronDown, ChevronUp, Clock, Trophy, AlertCircle
} from "lucide-react";
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

type Tab = "users" | "upload" | "overview";

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

  useEffect(() => {
    if (tab === "users" || tab === "overview") fetchUsers();
  }, [tab, fetchUsers]);

  if (status === "loading") return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  );
  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="container py-24 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">This area is restricted to administrators only.</p>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("Parsing file...");
    setMessageType("info");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);
      setMessage(`Parsed ${rows.length} questions. Uploading...`);

      const questions = rows.map((row) => {
        const options = [
          String(row["Option A"] || "A"),
          String(row["Option B"] || "B"),
          String(row["Option C"] || "C"),
          String(row["Option D"] || "D"),
        ];
        const answerRaw = String(row["Answer"] || row["Correct Option"] || row["Correct"] || "A").trim();
        let correctIndex = options.findIndex(o => o.trim() === answerRaw);
        if (correctIndex === -1) {
          if (answerRaw.toUpperCase().startsWith("A")) correctIndex = 0;
          else if (answerRaw.toUpperCase().startsWith("B")) correctIndex = 1;
          else if (answerRaw.toUpperCase().startsWith("C")) correctIndex = 2;
          else if (answerRaw.toUpperCase().startsWith("D")) correctIndex = 3;
          else correctIndex = 0;
        }
        return { subject: row["Subject"] || "Physics", text: row["Question"] || "Missing question", options, correctIndex };
      });

      const examGuess = file.name.toUpperCase().includes("IOE") ? "IOE" : "CEE";
      const payload = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        exam: examGuess,
        mode: "full",
        difficulty: "mixed",
        durationMinutes: examGuess === "CEE" ? 180 : 120,
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
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Administration</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Logged in as <span className="text-cyan-400">{session.user.email}</span></p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg border border-white/10 bg-white/[0.02]">
          {(["overview", "users", "upload"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm rounded-md capitalize transition",
                tab === t ? "bg-white/[0.08] text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "overview" ? "Overview" : t === "users" ? "Users" : "Upload Test"}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={users.length} color="text-blue-400" />
            <StatCard icon={<BarChart2 className="h-5 w-5" />} label="Active Users" value={activeUsers} color="text-green-400" />
            <StatCard icon={<Trophy className="h-5 w-5" />} label="Total Attempts" value={totalAttempts} color="text-orange-400" />
            <StatCard icon={<FileText className="h-5 w-5" />} label="Avg Attempts/User" value={users.length > 0 ? +(totalAttempts / users.length).toFixed(1) : 0} color="text-purple-400" />
          </div>

          <Card className="p-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-cyan-400" /> Recent Registrations
            </h2>
            <div className="space-y-2">
              {users.slice(0, 8).map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{u.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-400">{u._count.attempts} attempts</span>
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
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
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
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-white/[0.06] bg-white/[0.01]">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Joined</th>
                    <th className="text-center px-4 py-3">Attempts</th>
                    <th className="text-center px-4 py-3">Activity</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map(u => (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-cyan-300 border border-white/10 shrink-0">
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
                            u._count.attempts === 0 ? "bg-white/[0.06] text-muted-foreground" :
                              u._count.attempts >= 5 ? "bg-green-500/20 text-green-400" : "bg-cyan-500/20 text-cyan-400"
                          )}>
                            {u._count.attempts}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u._count.attempts > 0
                            ? <span className="text-xs text-green-400">Active</span>
                            : <span className="text-xs text-muted-foreground">Inactive</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.attempts.length > 0 && (
                              <button
                                onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition"
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
                          <td colSpan={5} className="px-4 py-0 bg-white/[0.01]">
                            <div className="py-3 space-y-2 border-t border-white/[0.06]">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent Test Attempts</p>
                              {u.attempts.map(a => (
                                <div key={a.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                  <div className="flex items-center gap-2">
                                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", a.testSet.exam === "CEE" ? "bg-cyan-500/20 text-cyan-400" : "bg-orange-500/20 text-orange-400")}>
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

          <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-muted-foreground space-y-1 mb-6">
            <p className="font-medium text-foreground text-sm mb-2">Required columns:</p>
            <p>• <span className="font-mono text-cyan-400">Subject</span> — Physics, Chemistry, Botany, Zoology, MAT, Mathematics, English</p>
            <p>• <span className="font-mono text-cyan-400">Question</span> — The full question text</p>
            <p>• <span className="font-mono text-cyan-400">Option A / B / C / D</span> — Answer choices</p>
            <p>• <span className="font-mono text-cyan-400">Answer</span> or <span className="font-mono text-cyan-400">Correct Option</span> — The correct answer text or letter (A/B/C/D)</p>
            <p className="mt-2 text-[11px] text-cyan-400/70">💡 The exam type (CEE/IOE) is auto-detected from the filename.</p>
          </div>

          <label className={cn(
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition",
            uploading
              ? "border-white/10 opacity-50 cursor-not-allowed"
              : "border-white/20 hover:border-cyan-400/40 hover:bg-cyan-500/[0.02]"
          )}>
            <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
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
              messageType === "success" ? "bg-green-500/10 border-green-400/20 text-green-300" :
              messageType === "error" ? "bg-red-500/10 border-red-400/20 text-red-300" :
              "bg-white/[0.03] border-white/10 text-muted-foreground"
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
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/10", color)}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  );
}
