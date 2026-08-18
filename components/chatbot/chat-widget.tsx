"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X, Send, Headset, Loader2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type Sender = "USER" | "BOT" | "AGENT" | "SYSTEM";
type ChatStatus = "BOT" | "PENDING_HUMAN" | "HUMAN" | "CLOSED";

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  agentName?: string | null;
  createdAt: string;
}

const VISITOR_ID_KEY = "el_chat_visitor_id";
const SESSION_ID_KEY = "el_chat_session_id";
const POLL_INTERVAL_MS = 3000;

const TOPICS: { label: string; prompt: string }[] = [
  { label: "Mock tests", prompt: "How do I start a mock test?" },
  { label: "Practice mode", prompt: "How does practice mode work?" },
  { label: "My results", prompt: "Where can I see my results and analytics?" },
  { label: "Merchandise", prompt: "How does buying or selling merchandise work?" },
  { label: "Account help", prompt: "I'm having trouble with my account." },
  { label: "Report a bug", prompt: "I found a bug on the site." },
];

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Small brand mark reused from the mobile nav header, so the widget reads
// as part of the site rather than a bolted-on third-party tool.
function BrandAvatar({ size = "h-8 w-8" }: { size?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500", size)}>
      <GraduationCap className="h-[55%] w-[55%] text-white" />
    </span>
  );
}

function statusMeta(status: ChatStatus, agentName: string | null) {
  switch (status) {
    case "PENDING_HUMAN":
      return { dot: "bg-amber-400", pulse: true, label: "Connecting you to an agent…" };
    case "HUMAN":
      return { dot: "bg-emerald-400", pulse: true, label: agentName ? `${agentName} · live agent` : "Live agent connected" };
    case "CLOSED":
      return { dot: "bg-slate-500", pulse: false, label: "Chat ended" };
    default:
      return { dot: "bg-emerald-400", pulse: true, label: "AI Assistant · Online" };
  }
}

export function ChatWidget() {
  const { data: authSession } = useSession();
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("BOT");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [requestingHuman, setRequestingHuman] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false);
  const [slowWarmup, setSlowWarmup] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const visitorIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const lastMessageTimeRef = useRef<string | null>(null);
  const agentJoinedRef = useRef(false);
  const streamingIdRef = useRef<string | null>(null);
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
    const storedSessionId = localStorage.getItem(SESSION_ID_KEY);
    if (storedSessionId) setSessionId(storedSessionId);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, awaitingFirstToken]);

  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  // Hydrate full history once a session id is known (regardless of whether
  // the panel is open yet), so the header status/badge are correct even
  // before the visitor opens the widget.
  useEffect(() => {
    if (!sessionId || hydratedRef.current) return;
    hydratedRef.current = true;
    poll(sessionId, true);
  }, [sessionId]);

  // Keep polling while a human is (or might be) involved, whether or not the
  // panel is open — plain bot replies come back synchronously from
  // POST /api/chat, so there's nothing to poll for in BOT mode.
  useEffect(() => {
    if (!sessionId || status === "BOT" || status === "CLOSED") return;
    const interval = setInterval(() => poll(sessionId, false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionId, status]);

  async function poll(sid: string, isInitialHydrate: boolean) {
    try {
      const visitorId = visitorIdRef.current;
      if (!visitorId) return;
      const params = new URLSearchParams({ visitorId });
      if (lastMessageTimeRef.current) params.set("after", lastMessageTimeRef.current);
      const res = await fetch(`/api/chat/${sid}/messages?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      if (data.status === "CLOSED") setWaitingForAgent(false);
      if (!data.messages?.length) return;

      lastMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt;

      const incoming: ChatMessage[] = [];
      for (const m of data.messages as ChatMessage[]) {
        if (m.sender === "AGENT") {
          setWaitingForAgent(false);
          if (!agentJoinedRef.current) {
            agentJoinedRef.current = true;
            incoming.push({
              id: `joined-${m.id}`,
              sender: "SYSTEM",
              text: `${m.agentName || "An agent"} joined the chat`,
              createdAt: m.createdAt,
            });
          }
        }
        incoming.push(m);
      }

      setMessages((prev) => [...prev, ...incoming]);
      if (!isInitialHydrate && !openRef.current) {
        setUnreadCount((c) => c + incoming.filter((m) => m.sender !== "SYSTEM").length);
      }
    } catch (error) {
      console.error("[ChatWidget] poll failed:", error);
    }
  }

  function clearWarmupTimer() {
    if (warmupTimerRef.current) {
      clearTimeout(warmupTimerRef.current);
      warmupTimerRef.current = null;
    }
    setSlowWarmup(false);
  }

  // Consumes the SSE-style event stream from POST /api/chat (our own
  // {type: "session"|"delta"|"done"} events, not raw OpenAI SSE — see
  // app/api/chat/route.ts) so the bot's reply grows in place as tokens
  // arrive instead of appearing all at once after a 10-20s wait.
  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setAwaitingFirstToken(true);
    streamingIdRef.current = null;
    let handoffActive = false;

    // The AI endpoint scales down when idle — the first message after a
    // quiet period can take 20s+ just to start responding, well before any
    // tokens arrive. Surface that after a few seconds so it reads as
    // "warming up" rather than broken.
    warmupTimerRef.current = setTimeout(() => setSlowWarmup(true), 5000);

    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, sender: "USER", text, createdAt: new Date().toISOString() }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          visitorId: visitorIdRef.current,
          text,
          name: authSession?.user?.name,
          email: authSession?.user?.email,
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;

          let event: { type: string; sessionId?: string; status?: ChatStatus; text?: string; message?: ChatMessage };
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }

          if (event.type === "session") {
            if (event.sessionId && event.sessionId !== sessionId) {
              setSessionId(event.sessionId);
              localStorage.setItem(SESSION_ID_KEY, event.sessionId);
            }
            if (event.status) setStatus(event.status);
            handoffActive = event.status === "PENDING_HUMAN" || event.status === "HUMAN";
          } else if (event.type === "delta" && event.text) {
            setAwaitingFirstToken(false);
            clearWarmupTimer();
            setMessages((prev) => {
              if (streamingIdRef.current) {
                return prev.map((m) => (m.id === streamingIdRef.current ? { ...m, text: m.text + event.text } : m));
              }
              const id = `streaming-${Date.now()}`;
              streamingIdRef.current = id;
              return [...prev, { id, sender: "BOT", text: event.text!, createdAt: new Date().toISOString() }];
            });
          } else if (event.type === "done") {
            setAwaitingFirstToken(false);
            clearWarmupTimer();
            const finalId = streamingIdRef.current;
            if (event.message) {
              lastMessageTimeRef.current = event.message.createdAt;
              const finalMessage = event.message;
              setMessages((prev) => (finalId ? prev.map((m) => (m.id === finalId ? finalMessage : m)) : [...prev, finalMessage]));
            } else if (handoffActive) {
              // Relayed to the Telegram staff group rather than answered by
              // the AI — show a waiting indicator until an AGENT reply
              // arrives via polling.
              setWaitingForAgent(true);
            } else if (!finalId) {
              // Streaming produced nothing and no message was persisted
              // (rare backend error) — say so instead of going silent.
              setMessages((prev) => [
                ...prev,
                { id: `local-error-${Date.now()}`, sender: "SYSTEM", text: "Something went wrong. Please try again.", createdAt: new Date().toISOString() },
              ]);
            }
            streamingIdRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error("[ChatWidget] send failed:", error);
      setMessages((prev) => [
        ...prev,
        { id: `local-error-${Date.now()}`, sender: "SYSTEM", text: "Message failed to send. Please try again.", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
      setAwaitingFirstToken(false);
      clearWarmupTimer();
      streamingIdRef.current = null;
    }
  }

  async function requestHuman() {
    if (requestingHuman || status !== "BOT") return;
    setRequestingHuman(true);
    try {
      const res = await fetch("/api/chat/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          visitorId: visitorIdRef.current,
          name: authSession?.user?.name,
          email: authSession?.user?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reach an agent");

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
      }
      setStatus(data.status);
      if (data.status === "PENDING_HUMAN") setWaitingForAgent(true);
      if (data.message) {
        lastMessageTimeRef.current = data.message.createdAt;
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      console.error("[ChatWidget] handoff failed:", error);
      setMessages((prev) => [
        ...prev,
        { id: `local-error-${Date.now()}`, sender: "SYSTEM", text: "Couldn't reach an agent right now. Please try again in a moment.", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setRequestingHuman(false);
    }
  }

  const meta = useMemo(() => {
    const lastAgent = [...messages].reverse().find((m) => m.sender === "AGENT");
    return statusMeta(status, lastAgent?.agentName ?? null);
  }, [status, messages]);

  const isWelcomeState = messages.length === 0;

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            role="dialog"
            aria-label="Chat with EntranceLab"
            className="absolute bottom-16 right-0 flex h-[32rem] w-[23rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#08090c] text-slate-100 shadow-2xl shadow-black/50"
          >
            {/* Ambient background: soft brand-color glow + slow-drifting
                particles, matching the Hero section's always-dark treatment
                — decorative only, so it's skipped under reduced motion. */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "radial-gradient(420px 220px at 15% 0%, rgba(59,130,246,0.16), transparent 60%), radial-gradient(360px 220px at 100% 15%, rgba(167,139,250,0.12), transparent 60%)",
                }}
              />
              {!prefersReducedMotion && (
                <>
                  <span className="absolute left-[20%] top-[22%] h-1 w-1 rounded-full bg-cyan-300/50 blur-[1px] animate-drift" />
                  <span className="absolute left-[70%] top-[14%] h-1 w-1 rounded-full bg-violet-300/40 blur-[1px] animate-drift-slow" />
                  <span className="absolute left-[45%] top-[55%] h-1 w-1 rounded-full bg-blue-300/40 blur-[1px] animate-drift-slow" />
                </>
              )}
            </div>

            {/* Header */}
            <div className="relative flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3.5">
              <div className="relative">
                {!prefersReducedMotion && (
                  <span className="absolute inset-0 -m-1 rounded-full bg-white/30 blur-md animate-pulse" aria-hidden="true" />
                )}
                <BrandAvatar size="h-9 w-9" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">EntranceLab Support</div>
                <div className="flex items-center gap-1.5 text-xs text-white/85">
                  <span className="relative flex h-1.5 w-1.5">
                    {meta.pulse && !prefersReducedMotion && (
                      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", meta.dot)} />
                    )}
                    <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", meta.dot)} />
                  </span>
                  {meta.label}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Persistent human-agent affordance — visible from the very
                first open, not gated behind a failed bot answer. */}
            <button
              onClick={requestHuman}
              disabled={status !== "BOT" || requestingHuman}
              className="relative flex items-center justify-center gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-sm transition hover:bg-white/[0.07] disabled:cursor-default disabled:opacity-70"
            >
              {requestingHuman ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Headset className="h-3.5 w-3.5" />}
              {status === "BOT" && "Talk to a human agent"}
              {status === "PENDING_HUMAN" && "Waiting for an agent…"}
              {status === "HUMAN" && "Connected to an agent"}
              {status === "CLOSED" && "This chat has ended"}
            </button>

            <div ref={listRef} className="relative flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {isWelcomeState && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <BrandAvatar size="h-7 w-7" />
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.07] px-3 py-2 text-sm text-slate-100 backdrop-blur-sm">
                      Hi! I&apos;m the EntranceLab assistant. Ask me about mock tests, practice questions, or your results — or talk to a human agent anytime.
                    </div>
                  </div>

                  {!authSession && (
                    <p className="px-1 text-xs text-slate-400">
                      <Link href="/login" className="font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300">
                        Sign in
                      </Link>{" "}
                      for a more personal experience.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {TOPICS.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => sendMessage(t.prompt)}
                        disabled={sending}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white disabled:opacity-60"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={cn("flex", m.sender === "USER" ? "justify-end" : m.sender === "SYSTEM" ? "justify-center" : "justify-start")}
                >
                  {m.sender === "SYSTEM" ? (
                    <p className="rounded-full border border-white/[0.06] bg-white/[0.05] px-3 py-1 text-xs text-slate-400">{m.text}</p>
                  ) : (
                    <div className="max-w-[85%]">
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                          m.sender === "USER"
                            ? "rounded-tr-sm bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-950/40"
                            : "rounded-tl-sm border border-white/[0.06] bg-white/[0.07] text-slate-100 backdrop-blur-sm"
                        )}
                      >
                        {m.sender === "AGENT" && (
                          <div className="mb-0.5 text-xs font-semibold text-cyan-300">{m.agentName || "Agent"}</div>
                        )}
                        {m.text}
                      </div>
                      <div className={cn("mt-1 px-1 text-[10px] text-slate-500", m.sender === "USER" ? "text-right" : "text-left")}>
                        {formatClock(m.createdAt)}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {(awaitingFirstToken || waitingForAgent) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start gap-1.5">
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.07] px-3.5 py-3 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-300/70 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300/70 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300/70" />
                  </div>
                  {awaitingFirstToken && slowWarmup && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-1 text-[11px] text-slate-500"
                    >
                      Waking up the assistant — first reply after a quiet period can take a little longer.
                    </motion.p>
                  )}
                  {waitingForAgent && (
                    <p className="px-1 text-[11px] text-slate-500">
                      {status === "PENDING_HUMAN" ? "Waiting for an available agent…" : "Waiting for a reply…"}
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="relative flex items-center gap-2 border-t border-white/10 bg-white/[0.03] p-2 backdrop-blur-sm"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={status === "CLOSED" ? "This chat has ended" : "Type a message…"}
                disabled={status === "CLOSED" || sending}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || status === "CLOSED"}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-950/40 transition hover:scale-105 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:hover:scale-100"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/30 transition hover:scale-105 active:scale-95"
      >
        {!open && !prefersReducedMotion && (
          <span className="absolute inset-0 -z-10 rounded-full bg-blue-500/40 blur-md animate-pulse" aria-hidden="true" />
        )}
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <AnimatePresence>
          {!open && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-red-500 px-1 text-[10px] font-semibold text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
