import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markListingDecided } from "@/lib/telegram";
import { deleteExpiredSoldListings } from "@/lib/merchandise";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteExpiredSoldListings();

    const listings = await prisma.merchandiseListing.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        whatsapp: true,
        imageUrl: true,
        status: true,
        soldAt: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        reports: {
          orderBy: { createdAt: "desc" },
          select: { id: true, reason: true, reporterContact: true, createdAt: true },
        },
      },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("List merchandise (admin) error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();
    if (typeof id !== "string" || !id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const listing = await prisma.merchandiseListing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.status !== "pending") {
      return NextResponse.json({ error: `Already ${listing.status}` }, { status: 400 });
    }

    const updated = await prisma.merchandiseListing.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    // Keep the Telegram message in sync so it never shows stale buttons for
    // a decision that was actually made here.
    if (listing.telegramChatId && listing.telegramMessageId) {
      await markListingDecided(
        listing.telegramChatId,
        listing.telegramMessageId,
        status as "approved" | "rejected",
        session.user.name || session.user.email || "admin"
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update merchandise status (admin) error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
