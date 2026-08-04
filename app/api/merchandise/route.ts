import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendListingForReview } from "@/lib/telegram";
import { MERCHANDISE_CATEGORIES } from "@/lib/merchandise";
import { isValidNepaliWhatsapp } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await rateLimit(`merch-post:${session.user.id}`, 10, 3600);
    if (!limit.success) return rateLimitResponse(limit);

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

    const listing = await prisma.merchandiseListing.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description: description.trim(),
        price: Math.round(price),
        category,
        whatsapp: whatsapp.trim().slice(0, 30),
        imageUrl: imageUrl || null,
      },
    });

    const sent = await sendListingForReview({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      whatsapp: listing.whatsapp,
      imageUrl: listing.imageUrl,
      sellerName: seller?.name || "Unknown",
      sellerEmail: seller?.email || "unknown",
    });

    if (sent) {
      await prisma.merchandiseListing.update({
        where: { id: listing.id },
        data: { telegramChatId: sent.chatId, telegramMessageId: sent.messageId },
      });
    }

    return NextResponse.json({ success: true, id: listing.id });
  } catch (error) {
    console.error("Create merchandise listing error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
