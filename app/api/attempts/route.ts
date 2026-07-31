import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { testId, startedAt, submittedAt, durationSeconds, answers, marked, subjectTimes } = body;

    if (!testId || !answers || !startedAt || !submittedAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const attempt = await prisma.attempt.create({
      data: {
        userId: session.user.id,
        testSetId: testId, // NOTE: The DB expects testSetId, but the client sends testId.
        startedAt: new Date(startedAt),
        submittedAt: new Date(submittedAt),
        durationSeconds,
        answers,
        marked: marked || {},
        subjectTimes: subjectTimes || {},
      },
    });

    // Invalidate analytics caches for this user
    await invalidateCache(`user_summaries_${session.user.id}_ALL`);
    await invalidateCache(`user_summaries_${session.user.id}_IOE`);
    await invalidateCache(`user_summaries_${session.user.id}_CEE`);

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error: any) {
    console.error("Save attempt error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
