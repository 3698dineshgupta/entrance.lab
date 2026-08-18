import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendChatHandoffToStaff } from "@/lib/telegram";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

const CONNECTING_TEXT = "Connecting you to an agent — someone from our team will reply here shortly.";

// Escalates a chat session to a human: posts the transcript so far into the
// Telegram staff group (see lib/telegram.ts) and flips the session to
// PENDING_HUMAN so app/api/chat/route.ts stops routing through the AI.
export async function POST(req: Request) {
  try {
    const { sessionId, visitorId, name, email } = (await req.json()) ?? {};
    if (typeof visitorId !== "string" || !visitorId.trim()) {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    const limit = await rateLimit(`chat-handoff:${getClientIp(req)}:${visitorId}`, 5, 60);
    if (!limit.success) return rateLimitResponse(limit);

    // Support requesting a human before any message has been sent — starts
    // an empty session rather than forcing a throwaway AI turn just to
    // create one.
    let session = typeof sessionId === "string"
      ? await prisma.chatSession.findUnique({
          where: { id: sessionId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null;

    if (!session || session.visitorId !== visitorId) {
      session = await prisma.chatSession.create({
        data: {
          visitorId,
          userName: typeof name === "string" ? name.slice(0, 200) : null,
          userEmail: typeof email === "string" ? email.slice(0, 200) : null,
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (session.status === "CLOSED") {
      return NextResponse.json({ error: "This chat has ended." }, { status: 410 });
    }

    // Already handed off — don't re-post to Telegram, just confirm.
    if (session.status !== "BOT") {
      return NextResponse.json({ sessionId: session.id, status: session.status });
    }

    const handoff = await sendChatHandoffToStaff({
      id: session.id,
      userName: session.userName,
      userEmail: session.userEmail,
      messages: session.messages.map((m) => ({ sender: m.sender as "USER" | "BOT" | "SYSTEM", text: m.text })),
    });

    const updated = await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        status: "PENDING_HUMAN",
        telegramChatId: handoff?.chatId ?? null,
        telegramMessageId: handoff?.messageId ?? null,
      },
    });

    const systemMessage = await prisma.chatMessage.create({
      data: { sessionId: session.id, sender: "SYSTEM", text: CONNECTING_TEXT },
    });

    return NextResponse.json({
      sessionId: updated.id,
      status: updated.status,
      message: { id: systemMessage.id, sender: systemMessage.sender, text: systemMessage.text, createdAt: systemMessage.createdAt },
    });
  } catch (error) {
    console.error("[api/chat/handoff] POST error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
