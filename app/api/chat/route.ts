import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamBotReply, FALLBACK_REPLY } from "@/lib/ai-chat";
import { sendChatMessageToStaff } from "@/lib/telegram";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Send (and, in BOT mode, stream an AI reply to) a chat message. Creates a
// new ChatSession on first call. Once a session has been handed off
// (PENDING_HUMAN/HUMAN), messages are relayed into the Telegram thread
// instead of going through the AI — see app/api/chat/handoff/route.ts.
//
// Responds as a small SSE-style event stream (not raw OpenAI SSE — our own
// {type: "session"|"delta"|"done"} events) so the widget can render the bot
// reply as it's generated instead of waiting for the full completion, which
// on this AI endpoint has been observed taking 10-20s+.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { sessionId, visitorId, text, name, email } = body ?? {};

  if (typeof visitorId !== "string" || !visitorId.trim()) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const trimmedText = text.trim().slice(0, 2000);

  const limit = await rateLimit(`chat:${getClientIp(req)}:${visitorId}`, 20, 60);
  if (!limit.success) return rateLimitResponse(limit);

  let session;
  try {
    const existing = sessionId ? await prisma.chatSession.findUnique({ where: { id: sessionId } }) : null;
    session = !existing || existing.visitorId !== visitorId
      ? await prisma.chatSession.create({
          data: {
            visitorId,
            userName: typeof name === "string" ? name.slice(0, 200) : null,
            userEmail: typeof email === "string" ? email.slice(0, 200) : null,
          },
        })
      : existing;

    await prisma.chatMessage.create({ data: { sessionId: session.id, sender: "USER", text: trimmedText } });
  } catch (error) {
    console.error("[api/chat] POST setup error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(sseEvent(data)));
      send({ type: "session", sessionId: session.id, status: session.status });

      if (session.status === "PENDING_HUMAN" || session.status === "HUMAN") {
        if (session.telegramChatId && session.telegramMessageId) {
          await sendChatMessageToStaff(session.telegramChatId, session.telegramMessageId, trimmedText);
        }
        send({ type: "done" });
        controller.close();
        return;
      }

      try {
        const history = await prisma.chatMessage.findMany({
          where: { sessionId: session.id, sender: { in: ["USER", "BOT"] } },
          orderBy: { createdAt: "asc" },
          take: 20,
        });

        let full = "";
        for await (const delta of streamBotReply(
          history.map((m) => ({ role: m.sender === "USER" ? ("user" as const) : ("assistant" as const), content: m.text }))
        )) {
          full += delta;
          send({ type: "delta", text: delta });
        }
        if (!full) full = FALLBACK_REPLY;

        const botMessage = await prisma.chatMessage.create({ data: { sessionId: session.id, sender: "BOT", text: full } });
        send({ type: "done", message: { id: botMessage.id, sender: botMessage.sender, text: botMessage.text, createdAt: botMessage.createdAt } });
      } catch (error) {
        console.error("[api/chat] stream error:", error);
        send({ type: "done" });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
