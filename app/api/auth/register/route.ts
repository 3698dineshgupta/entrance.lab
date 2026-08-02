import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A short list of disposable/throwaway email domains — not exhaustive, but
// blocks the most common bulk-signup providers without maintaining a huge list.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "yopmail.com", "throwawaymail.com", "trashmail.com",
  "getnada.com", "fakeinbox.com", "sharklasers.com", "dispostable.com",
]);

export async function POST(req: Request) {
  try {
    // 8 registrations per IP per hour — generous for real users, enough to
    // blunt automated bulk account creation.
    const ip = getClientIp(req);
    const limit = await rateLimit(`register:${ip}`, 8, 3600);
    if (!limit.success) return rateLimitResponse(limit);

    const { name, email: rawEmail, password } = await req.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    const domain = email.split("@")[1];
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json({ error: "Please use a permanent email address" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : null,
        email,
        password: hashed,
        role: "USER",
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
