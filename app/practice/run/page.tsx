import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentWeekStart } from "@/lib/practice-data";
import { PracticeInterface, PracticeQuestion } from "@/components/practice-interface";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ exam?: string; subject?: string; topic?: string; subtopic?: string }>;
}

export default async function PracticeRunPage({ searchParams }: Props) {
  const { exam, subject, topic, subtopic } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/practice");
  if (!exam || !subject) notFound();

  const rows = await prisma.question.findMany({
    where: {
      subject,
      topic: topic ? topic : undefined,
      subtopic: subtopic ? subtopic : undefined,
      testSet: { exam },
    },
    select: { id: true, subject: true, topic: true, subtopic: true, text: true, options: true, correctIndex: true, explanation: true },
    // Deterministic order so the same duplicate row (same text, seeded into
    // multiple test sets) is picked every time — otherwise progress tracked
    // against one copy's id could appear to vanish if a different copy's id
    // won the dedup on a later visit.
    orderBy: { id: "asc" },
  });

  // De-dupe identical question text (same content seeded across multiple test sets)
  const seenText = new Set<string>();
  const deduped: PracticeQuestion[] = [];
  for (const r of rows) {
    if (seenText.has(r.text)) continue;
    seenText.add(r.text);
    deduped.push({
      id: r.id,
      subject: r.subject,
      topic: r.topic,
      subtopic: r.subtopic,
      text: r.text,
      options: r.options as string[],
      correctIndex: r.correctIndex,
      explanation: r.explanation,
      previouslyAnswered: false,
    });
  }

  if (deduped.length === 0) notFound();

  // Resume support: questions this user has already answered this practice
  // week are pushed to the end, so a fresh visit starts on new material
  // instead of repeating what's already been covered. Progress (and this
  // resume priority) resets each week — a question answered last week is
  // fresh again.
  const priorAttempts = await prisma.practiceAttempt.findMany({
    where: {
      userId: session.user.id,
      questionId: { in: deduped.map((q) => q.id) },
      answeredAt: { gte: getCurrentWeekStart() },
    },
    select: { questionId: true },
  });
  const answeredIds = new Set(priorAttempts.map((a) => a.questionId));
  const questions = deduped
    .map((q) => ({ ...q, previouslyAnswered: answeredIds.has(q.id) }))
    .sort((a, b) => Number(a.previouslyAnswered) - Number(b.previouslyAnswered));

  return (
    <PracticeInterface
      questions={questions}
      subject={subject}
      topic={topic ?? null}
      subtopic={subtopic ? stripNumericPrefix(subtopic) : null}
    />
  );
}

function stripNumericPrefix(s: string): string {
  return s.replace(/^\d+(\.\d+)?\s*/, "");
}
