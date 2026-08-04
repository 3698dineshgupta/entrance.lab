import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendListingForReview } from "@/lib/telegram";
import { MERCHANDISE_CATEGORIES } from "@/lib/merchandise";
import { isValidNepaliWhatsapp } from "@/lib/phone";

interface Props {
  params: Promise<{ id: string }>;
}

const EDITABLE_STATUSES = new Set(["pending", "approved", "rejected"]);

export async function PATCH(req: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await rateLimit(`merch-edit:${session.user.id}`, 15, 3600);
    if (!limit.success) return rateLimitResponse(limit);

    const { id } = await params;
    const existing = await prisma.merchandiseListing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    // Owner only — never trust a client-supplied userId for this.
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own listings" }, { status: 403 });
    }
    if (!EDITABLE_STATUSES.has(existing.status)) {
      return NextResponse.json({ error: "Sold listings can't be edited" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, price, category, whatsapp, imageUrl } = body;

    if (typeof title !== "string" || !title.trim() || title.length > 120) {
      return NextResponse.json({ error: "Enter a title (up to 120 characters)." }, { status: 400 });
    }
    if (typeof description !== "string" || !description.trim() || description.length > 2000) {
      return NextResponse.json({ error: "Enter a description (up to 2000 characters)." }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0 || price > 10_000_000) {
      return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
    }
    if (typeof category !== "string" || !MERCHANDISE_CATEGORIES.includes(category as any)) {
      return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
    }
    if (typeof whatsapp !== "string" || !isValidNepaliWhatsapp(whatsapp)) {
      return NextResponse.json({ error: "Enter a valid WhatsApp number." }, { status: 400 });
    }
    if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Invalid image." }, { status: 400 });
    }

    const seller = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } });

    // Any edit re-enters moderation — an approved listing whose content just
    // changed shouldn't stay live unreviewed, and this reuses the exact same
    // Telegram review flow a fresh submission gets.
    const updated = await prisma.merchandiseListing.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description.trim(),
        price: Math.round(price),
        category,
        whatsapp: whatsapp.trim().slice(0, 30),
        imageUrl: imageUrl || null,
        status: "pending",
        telegramChatId: null,
        telegramMessageId: null,
      },
    });

    const sent = await sendListingForReview({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      price: updated.price,
      category: updated.category,
      whatsapp: updated.whatsapp,
      imageUrl: updated.imageUrl,
      sellerName: seller?.name || "Unknown",
      sellerEmail: seller?.email || "unknown",
      isEdit: true,
    });

    if (sent) {
      await prisma.merchandiseListing.update({
        where: { id: updated.id },
        data: { telegramChatId: sent.chatId, telegramMessageId: sent.messageId },
      });
    }

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error) {
    console.error("Update merchandise listing error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
