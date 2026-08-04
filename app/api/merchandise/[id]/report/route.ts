import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { sendFraudAlert } from "@/lib/telegram";

interface Props {
  params: Promise<{ id: string }>;
}

// Public — someone reporting a scam may have only ever talked to the seller
// over WhatsApp and never created an account.
export async function POST(req: Request, { params }: Props) {
  try {
    const ip = getClientIp(req);
    const limit = await rateLimit(`merch-report:${ip}`, 5, 3600);
    if (!limit.success) return rateLimitResponse(limit);

    const { id } = await params;
    const { reason, reporterContact } = await req.json();

    if (typeof reason !== "string" || !reason.trim() || reason.length > 1000) {
      return NextResponse.json({ error: "Describe what happened (up to 1000 characters)." }, { status: 400 });
    }

    const listing = await prisma.merchandiseListing.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    await prisma.merchandiseReport.create({
      data: {
        listingId: listing.id,
        reason: reason.trim(),
        reporterContact: typeof reporterContact === "string" && reporterContact.trim() ? reporterContact.trim().slice(0, 30) : null,
      },
    });

    await sendFraudAlert({
      listingId: listing.id,
      listingTitle: listing.title,
      reason: reason.trim(),
      reporterContact: typeof reporterContact === "string" ? reporterContact.trim() || null : null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Merchandise report error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
