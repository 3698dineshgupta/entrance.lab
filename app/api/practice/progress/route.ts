import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId, correct } = await req.json();
    if (!questionId || typeof correct !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.practiceAttempt.upsert({
      where: { userId_questionId: { userId: session.user.id, questionId } },
      update: { correct, answeredAt: new Date() },
      create: { userId: session.user.id, questionId, correct },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save practice progress error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
