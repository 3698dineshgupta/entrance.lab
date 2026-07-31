import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, exam, mode, difficulty, durationMinutes, questions } = body;

    if (!title || !exam || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Create the test set and all questions in a single transaction
    const testSet = await prisma.testSet.create({
      data: {
        title,
        exam,
        mode: mode || "full",
        difficulty: difficulty || "mixed",
        durationMinutes: durationMinutes || 180,
        questions: {
          create: questions.map((q: any) => ({
            subject: q.subject,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, testSetId: testSet.id });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
