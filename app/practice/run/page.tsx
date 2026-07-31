import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PracticeInterface, PracticeQuestion } from "@/components/practice-interface";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ exam?: string; subject?: string; topic?: string }>;
}

export default async function PracticeRunPage({ searchParams }: Props) {
  const { exam, subject, topic } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/practice");
  if (!exam || !subject) notFound();

  const rows = await prisma.question.findMany({
    where: {
      subject,
      topic: topic ? topic : undefined,
      testSet: { exam },
    },
    select: { id: true, subject: true, topic: true, text: true, options: true, correctIndex: true, explanation: true },
  });

  // De-dupe identical question text (same content seeded across multiple test sets)
  const seenText = new Set<string>();
  const questions: PracticeQuestion[] = [];
  for (const r of rows) {
    if (seenText.has(r.text)) continue;
    seenText.add(r.text);
    questions.push({
      id: r.id,
      subject: r.subject,
      topic: r.topic,
      text: r.text,
      options: r.options as string[],
      correctIndex: r.correctIndex,
      explanation: r.explanation,
    });
  }

  if (questions.length === 0) notFound();

  return <PracticeInterface questions={questions} subject={subject} topic={topic ?? null} />;
}
