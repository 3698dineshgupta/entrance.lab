import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await rateLimit(`merch-upload:${session.user.id}`, 15, 3600);
    if (!limit.success) return rateLimitResponse(limit);

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate by declared MIME type and by sniffing the first bytes
    // (magic number) so a renamed .html/.svg can't slip through as "image".
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isJpeg = head[0] === 0xff && head[1] === 0xd8;
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: "File content doesn't match a supported image format" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const blob = await put(`merchandise/${session.user.id}-${Date.now()}.${ext}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Merchandise image upload error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
