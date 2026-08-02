import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserSummaries } from "@/lib/analytics";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examFilter = searchParams.get("exam") || "ALL";

    const summaries = await getUserSummaries(session.user.id, examFilter);

    return NextResponse.json(summaries, {
      headers: {
        // Cache for 10 seconds to avoid hammering DB on rapid filter changes
        "Cache-Control": "private, max-age=10",
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
