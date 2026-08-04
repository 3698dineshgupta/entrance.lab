import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

interface Props {
  params: Promise<{ id: string }>;
}

// Pulls the public_id back out of a Cloudinary secure_url, e.g.
// ".../upload/v1785800227/entrancelab/merchandise/abc123.png" ->
// "entrancelab/merchandise/abc123".
function cloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
}

export async function DELETE(req: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listing = await prisma.merchandiseListing.findUnique({ where: { id }, select: { imageUrl: true } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    await prisma.merchandiseListing.delete({ where: { id } });

    if (listing.imageUrl) {
      const publicId = cloudinaryPublicId(listing.imageUrl);
      if (publicId) {
        cloudinary.uploader.destroy(publicId).catch((err) =>
          console.error("Failed to delete Cloudinary image on listing delete:", err)
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete merchandise listing (admin) error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
