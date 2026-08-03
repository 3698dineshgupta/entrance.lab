// Thin wrapper around the Telegram Bot API for the merchandise approval
// flow: post a new listing to the staff group with Approve/Reject buttons,
// then edit that same message in place once a decision is made (from
// either Telegram itself or the admin panel) so the two never disagree.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const STAFF_GROUP_ID = process.env.TELEGRAM_STAFF_GROUP_ID;
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

export interface ListingForReview {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  whatsapp: string;
  imageUrl: string | null;
  sellerName: string;
  sellerEmail: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function caption(listing: ListingForReview): string {
  return [
    `🛒 <b>New merchandise listing</b>`,
    ``,
    `<b>${escapeHtml(listing.title)}</b>`,
    `Rs. ${listing.price.toLocaleString("en-IN")} · ${escapeHtml(listing.category)}`,
    ``,
    escapeHtml(listing.description).slice(0, 800),
    ``,
    `Seller: ${escapeHtml(listing.sellerName)} (${escapeHtml(listing.sellerEmail)})`,
    `WhatsApp: ${escapeHtml(listing.whatsapp)}`,
  ].join("\n");
}

function approveRejectKeyboard(id: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Approve", callback_data: `approve:${id}` },
        { text: "❌ Reject", callback_data: `reject:${id}` },
      ],
    ],
  };
}

// Returns the chat id + message id to store against the listing, so a later
// decision (from Telegram or the admin panel) can edit this exact message.
export async function sendListingForReview(
  listing: ListingForReview
): Promise<{ chatId: string; messageId: number } | null> {
  if (!API_BASE || !STAFF_GROUP_ID) {
    console.error("[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_STAFF_GROUP_ID not configured — skipping notification.");
    return null;
  }

  try {
    const endpoint = listing.imageUrl ? "sendPhoto" : "sendMessage";
    const body: Record<string, unknown> = {
      chat_id: STAFF_GROUP_ID,
      reply_markup: approveRejectKeyboard(listing.id),
      parse_mode: "HTML",
    };
    if (listing.imageUrl) {
      body.photo = listing.imageUrl;
      body.caption = caption(listing);
    } else {
      body.text = caption(listing);
    }

    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[Telegram] sendListingForReview failed:", data.description);
      return null;
    }
    return { chatId: String(data.result.chat.id), messageId: data.result.message_id };
  } catch (error) {
    console.error("[Telegram] sendListingForReview error:", error);
    return null;
  }
}

// Called after a decision is made, from either the Telegram button handler
// or the admin panel, so the group message always reflects the true status.
// Photo messages can't have arbitrary text re-fetched-and-edited here, so
// rather than editing the original caption we just clear its buttons and
// post the decision as a threaded reply — works uniformly for text and
// photo listings.
export async function markListingDecided(
  chatId: string,
  messageId: number,
  decision: "approved" | "rejected",
  decidedBy: string
): Promise<void> {
  if (!API_BASE) return;
  const text = decision === "approved"
    ? `✅ <b>Approved</b> by ${escapeHtml(decidedBy)}`
    : `❌ <b>Rejected</b> by ${escapeHtml(decidedBy)}`;

  try {
    await fetch(`${API_BASE}/editMessageReplyMarkup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
    });
    await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, reply_to_message_id: messageId, text, parse_mode: "HTML" }),
    });
  } catch (error) {
    console.error("[Telegram] markListingDecided error:", error);
  }
}

export async function answerCallback(callbackQueryId: string, text: string): Promise<void> {
  if (!API_BASE) return;
  try {
    await fetch(`${API_BASE}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (error) {
    console.error("[Telegram] answerCallback error:", error);
  }
}
