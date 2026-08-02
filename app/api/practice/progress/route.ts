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

    const body = await req.json();
    const { questionId, selectedIndex } = body;
    if (typeof questionId !== "string" || !questionId || typeof selectedIndex !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Correctness is derived from our own copy of the question, never
    // trusted from the client — otherwise a direct API call could mark any
    // question "correct" without answering it, inflating practice accuracy
    // and the mock-test readiness verdict.
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { correctIndex: true },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    const correct = selectedIndex === question.correctIndex;

    await prisma.practiceAttempt.upsert({
      where: { userId_questionId: { userId: session.user.id, questionId } },
      update: { correct, answeredAt: new Date() },
      create: { userId: session.user.id, questionId, correct },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save practice progress error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
