// One-time setup: tells Telegram where to send button-click updates for the
// merchandise approval flow, and staff-group message updates for the chat
// human-handoff flow (see app/api/telegram/webhook/route.ts). Must point at
// the LIVE production URL — Telegram can't reach localhost. Re-run any time
// the bot token, domain, or TELEGRAM_WEBHOOK_SECRET changes.
//
// Usage: npx tsx scripts/setup-telegram-webhook.ts

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.entrancelab.in.net";

async function main() {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  if (!WEBHOOK_SECRET) throw new Error("TELEGRAM_WEBHOOK_SECRET not set");

  const webhookUrl = `${SITE_URL}/api/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ["callback_query", "message"],
    }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (!data.ok) {
    console.error("Failed to set webhook.");
    process.exit(1);
  }
  console.log(`\nWebhook set to ${webhookUrl}`);

  const info = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`).then((r) => r.json());
  console.log("\nCurrent webhook info:", JSON.stringify(info.result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
