import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { attempts: true } },
      attempts: {
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          submittedAt: true,
          durationSeconds: true,
          testSet: { select: { title: true, exam: true } },
          // We don't join questions here for performance; score is computed when needed
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = await req.json();
    if (typeof userId !== "string" || !userId || (role !== "USER" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    // Prevent an admin from accidentally demoting themselves and losing
    // access to this very panel mid-session.
    if (userId === session.user.id && role !== "ADMIN") {
      return NextResponse.json({ error: "You can't change your own admin role." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    if (userId === session.user.id) {
      return NextResponse.json({ error: "You can't delete your own account from here." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
