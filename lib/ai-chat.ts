// Thin wrapper around an OpenAI-compatible chat completions endpoint
// (NVIDIA's hosted models by default) for the chat widget's bot-answered
// mode. Streams content deltas rather than waiting for a full completion —
// full replies on this endpoint have been observed taking 10-20s+, so
// streaming is what makes the wait feel reasonable.

const API_KEY = process.env.NVIDIA_API_KEY;
const BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";

const SYSTEM_PROMPT = [
  "You are the support assistant embedded on EntranceLab, a site offering mock tests and practice questions for Nepal's IOE (engineering) and CEE (medical) entrance exams.",
  "Answer questions about the site, mock tests, practice questions, results, merchandise listings, and general exam-prep guidance concisely and helpfully.",
  "If you don't know something, or the visitor needs account-specific help, a refund, or anything you can't resolve, tell them to use the \"Talk to a human agent\" button instead of guessing.",
].join(" ");

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export const FALLBACK_REPLY =
  "Sorry, I'm having trouble answering right now. Tap \"Talk to a human agent\" above and someone from our team will help.";

// Only the trailing history is sent, to keep latency/cost bounded on long
// conversations.
const MAX_HISTORY_TURNS = 10;

// Safety net for a hung/slow upstream — well under typical serverless
// function limits. Streaming means real replies should start producing
// deltas within a couple seconds; this only fires if the connection never
// gets going at all.
const TIMEOUT_MS = 25_000;

// Yields content deltas as they arrive. Deliberately does NOT request or
// forward extended "thinking"/reasoning tokens (some Nemotron models
// support enable_thinking) — those are generated before the visible answer,
// so streaming them wouldn't help perceived latency, and raw chain-of-
// thought isn't a polished thing to show a visitor anyway. Yields
// FALLBACK_REPLY as a single item if nothing else was produced.
export async function* streamBotReply(history: ChatTurn[]): AsyncGenerator<string> {
  if (!API_KEY) {
    console.error("[AIChat] NVIDIA_API_KEY not configured — yielding fallback reply.");
    yield FALLBACK_REPLY;
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let yieldedAny = false;

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-MAX_HISTORY_TURNS),
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      console.error("[AIChat] Completion request failed:", res.status, await res.text().catch(() => ""));
      yield FALLBACK_REPLY;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep a possibly-partial trailing line for the next chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) {
            yieldedAny = true;
            yield delta;
          }
        } catch {
          // Malformed/partial SSE line — skip it rather than aborting the whole stream.
        }
      }
    }

    if (!yieldedAny) yield FALLBACK_REPLY;
  } catch (error) {
    console.error("[AIChat] streamBotReply error:", error);
    if (!yieldedAny) yield FALLBACK_REPLY;
  } finally {
    clearTimeout(timeout);
  }
}
