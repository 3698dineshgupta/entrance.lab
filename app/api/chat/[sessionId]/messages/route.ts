import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Polling endpoint the widget hits every ~3s once a chat is
// PENDING_HUMAN/HUMAN, to pick up agent replies relayed from Telegram by
// app/api/telegram/webhook/route.ts. visitorId doubles as the only
// ownership check available without requiring login, matching the trust
// level of the rest of this app's anonymous flows.
export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const url = new URL(req.url);
    const visitorId = url.searchParams.get("visitorId");
    const after = url.searchParams.get("after");

    if (!visitorId) {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.visitorId !== visitorId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const afterDate = after ? new Date(after) : new Date(0);
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId, createdAt: { gt: afterDate } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      status: session.status,
      messages: messages.map((m) => ({ id: m.id, sender: m.sender, text: m.text, agentName: m.agentName, createdAt: m.createdAt })),
    });
  } catch (error) {
    console.error("[api/chat/[sessionId]/messages] GET error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
