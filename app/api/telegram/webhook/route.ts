import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markListingDecided, answerCallback } from "@/lib/telegram";

const STAFF_GROUP_ID = process.env.TELEGRAM_STAFF_GROUP_ID;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

// A staff member replying (in the staff group) to the handoff message
// created by sendChatHandoffToStaff routes their answer back to the
// matching ChatSession, which the widget picks up via polling
// (see app/api/chat/[sessionId]/messages/route.ts).
async function handleChatReply(message: {
  chat?: { id?: number | string };
  reply_to_message?: { message_id?: number };
  text?: string;
  from?: { username?: string; first_name?: string };
}) {
  const chatId = String(message.chat?.id ?? "");
  const rootMessageId = message.reply_to_message?.message_id;
  if (!STAFF_GROUP_ID || chatId !== STAFF_GROUP_ID || !rootMessageId || !message.text) return;

  const session = await prisma.chatSession.findFirst({
    where: { telegramChatId: chatId, telegramMessageId: rootMessageId },
  });
  if (!session || session.status === "CLOSED") return;

  const agentName = message.from?.username ? `@${message.from.username}` : message.from?.first_name || "Agent";

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { sessionId: session.id, sender: "AGENT", text: message.text, agentName },
    }),
    prisma.chatSession.update({ where: { id: session.id }, data: { status: "HUMAN" } }),
  ]);
}

// Telegram calls this whenever an admin taps Approve/Reject in the staff
// group. Verified via the secret token set during setWebhook (see
// scripts/setup-telegram-webhook.ts) — without it, anyone who found this
// URL could approve/reject listings by POSTing a fake callback_query.
export async function POST(req: Request) {
  try {
    if (!WEBHOOK_SECRET || req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = await req.json();

    const message = update.message;
    if (message && message.reply_to_message && typeof message.text === "string") {
      await handleChatReply(message);
      return NextResponse.json({ ok: true });
    }

    const callback = update.callback_query;
    if (!callback || typeof callback.data !== "string") {
      // Not a button-click or a chat reply (could be a bot added/removed
      // event, etc.) — nothing to do, acknowledge anyway.
      return NextResponse.json({ ok: true });
    }

    // Only react to callbacks from our own staff group's messages.
    const chatId = String(callback.message?.chat?.id ?? "");
    if (!STAFF_GROUP_ID || chatId !== STAFF_GROUP_ID) {
      return NextResponse.json({ ok: true });
    }

    const [action, listingId] = String(callback.data).split(":");
    if ((action !== "approve" && action !== "reject") || !listingId) {
      return NextResponse.json({ ok: true });
    }

    const listing = await prisma.merchandiseListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      await answerCallback(callback.id, "Listing no longer exists.");
      return NextResponse.json({ ok: true });
    }
    if (listing.status !== "pending") {
      await answerCallback(callback.id, `Already ${listing.status}.`);
      return NextResponse.json({ ok: true });
    }

    const decision = action === "approve" ? "approved" : "rejected";
    await prisma.merchandiseListing.update({ where: { id: listingId }, data: { status: decision } });

    const decidedBy = callback.from?.username
      ? `@${callback.from.username}`
      : callback.from?.first_name || "admin";

    if (listing.telegramChatId && listing.telegramMessageId) {
      await markListingDecided(listing.telegramChatId, listing.telegramMessageId, decision, decidedBy);
    }
    await answerCallback(callback.id, decision === "approved" ? "Approved ✅" : "Rejected ❌");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    // Still 200 — Telegram retries aggressively on non-2xx, which would
    // just hammer this endpoint for an error it can't self-resolve.
    return NextResponse.json({ ok: true });
  }
}
