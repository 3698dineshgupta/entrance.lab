import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/redis";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Defense-in-depth against automated/scripted submissions — generous
    // enough that no real test-taker (who submits one attempt at a time)
    // would ever hit it.
    const limit = await rateLimit(`attempts:${session.user.id}`, 30, 3600);
    if (!limit.success) return rateLimitResponse(limit);

    const body = await req.json();
    const { testId, startedAt, submittedAt, durationSeconds, answers, marked, subjectTimes } = body;

    if (!testId || !answers || !startedAt || !submittedAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const attempt = await prisma.attempt.create({
      data: {
        userId: session.user.id,
        testId,
        startedAt: new Date(startedAt),
        submittedAt: new Date(submittedAt),
        durationSeconds,
        answers,
        marked: marked || {},
        subjectTimes: subjectTimes || {},
      },
    });

    // Invalidate analytics caches for this user
    await invalidateCache(`user_summaries_v2_${session.user.id}_ALL`);
    await invalidateCache(`user_summaries_v2_${session.user.id}_IOE`);
    await invalidateCache(`user_summaries_v2_${session.user.id}_CEE`);

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error) {
    console.error("Save attempt error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
