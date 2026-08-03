import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listing = await prisma.merchandiseListing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    // Owner or admin only — never trust a client-supplied userId for this.
    if (listing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "You can only manage your own listings" }, { status: 403 });
    }
    if (listing.status !== "approved") {
      return NextResponse.json({ error: "Only approved listings can be marked sold" }, { status: 400 });
    }

    const updated = await prisma.merchandiseListing.update({
      where: { id },
      data: { status: "sold", soldAt: new Date() },
      select: { id: true, status: true, soldAt: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Mark listing sold error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
