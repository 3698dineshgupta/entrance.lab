import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// Permanently deletes the signed-in user's own account. Requires their
// current password (not just an "are you sure?" confirm) since this is
// irreversible — Attempt, PracticeAttempt, and MerchandiseListing (with its
// MerchandiseReport rows) all cascade-delete via the schema's onDelete:
// Cascade; MaterialRequest keeps its row but has userId set null
// (onDelete: SetNull) so admins can still see/fulfill a pending request
// even after the requester's account is gone.
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Keyed by user id (not IP) — this is a re-auth check on an already
    // logged-in session, so the account itself is the meaningful unit to
    // throttle, same reasoning as the login rate limit being keyed by email.
    const limit = await rateLimit(`delete-account:${session.user.id}`, 5, 600);
    if (!limit.success) return rateLimitResponse(limit);

    // An admin self-deleting through this endpoint risks a platform with no
    // remaining admin account. Mirrors the admin-panel's existing
    // self-lockout guards (can't demote/delete their own admin account from
    // there either) — an admin who wants to leave needs another admin to
    // demote them first.
    if (session.user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts can't be self-deleted. Ask another admin to demote you first." },
        { status: 400 }
      );
    }

    const { password } = await req.json();
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Enter your password to confirm." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
