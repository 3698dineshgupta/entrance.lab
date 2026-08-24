import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendChatEndedToStaff } from "@/lib/telegram";

// Lets a visitor explicitly end a chat rather than just closing the widget
// panel (which only hides it — the session stays open and resumes on
// reopen). Marks the session CLOSED so a later "Talk to a human agent" or
// message starts a fresh session instead of reviving a stale one.
export async function POST(req: Request) {
  try {
    const { sessionId, visitorId } = (await req.json()) ?? {};
    if (typeof sessionId !== "string" || typeof visitorId !== "string") {
      return NextResponse.json({ error: "sessionId and visitorId are required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.visitorId !== visitorId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status === "CLOSED") {
      return NextResponse.json({ status: "CLOSED" });
    }

    if ((session.status === "PENDING_HUMAN" || session.status === "HUMAN") && session.telegramChatId && session.telegramMessageId) {
      await sendChatEndedToStaff(session.telegramChatId, session.telegramMessageId);
    }

    await prisma.$transaction([
      prisma.chatMessage.create({ data: { sessionId: session.id, sender: "SYSTEM", text: "You left the chat." } }),
      prisma.chatSession.update({ where: { id: session.id }, data: { status: "CLOSED" } }),
    ]);

    return NextResponse.json({ status: "CLOSED" });
  } catch (error) {
    console.error("[api/chat/leave] POST error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
