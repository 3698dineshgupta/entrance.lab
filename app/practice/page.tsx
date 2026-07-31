import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/redis";
import { PracticeBrowser } from "./practice-browser";
import { getTopicOrder } from "@/lib/syllabus";

export const dynamic = "force-dynamic";

export interface TopicGroup {
  topic: string;
  count: number;
}
export interface SubjectGroup {
  subject: string;
  total: number;
  topics: TopicGroup[];
}
export interface ExamGroup {
  exam: string;
  subjects: SubjectGroup[];
}

export default async function PracticePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/practice");

  const rows = await fetchWithCache(
    "practice_topic_index",
    async () => {
      return prisma.question.findMany({
        select: { subject: true, topic: true, text: true, testSet: { select: { exam: true } } },
      });
    },
    600 // 10 minutes
  );

  // De-dupe identical question text within the same exam+subject+topic
  // (the same content was seeded into multiple test sets).
  const seen = new Set<string>();
  const exams: Record<string, Record<string, Record<string, number>>> = {};

  for (const r of rows as any[]) {
    const exam = r.testSet.exam as string;
    const subject = r.subject as string;
    const topic = (r.topic as string | null) ?? "General";
    const dedupeKey = `${exam}::${subject}::${topic}::${r.text}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    exams[exam] ??= {};
    exams[exam][subject] ??= {};
    exams[exam][subject][topic] = (exams[exam][subject][topic] ?? 0) + 1;
  }

  const examGroups: ExamGroup[] = Object.entries(exams).map(([exam, subjects]) => ({
    exam,
    subjects: Object.entries(subjects).map(([subject, topics]) => {
      const order = getTopicOrder(exam, subject);
      const rank = (topic: string) => {
        const i = order.indexOf(topic);
        return i === -1 ? order.length : i;
      };
      return {
        subject,
        total: Object.values(topics).reduce((a, b) => a + b, 0),
        topics: Object.entries(topics)
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => rank(a.topic) - rank(b.topic)),
      };
    }).sort((a, b) => b.total - a.total),
  }));

  return <PracticeBrowser examGroups={examGroups} />;
}
