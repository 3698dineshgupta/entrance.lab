import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/redis";
import { getTopicOrder } from "@/lib/syllabus";

export interface SubtopicGroup {
  subtopic: string;
  count: number;
}
export interface TopicGroup {
  topic: string;
  count: number;
  subtopics: SubtopicGroup[];
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

export async function getPracticeIndex(): Promise<ExamGroup[]> {
  const rows = await fetchWithCache(
    "practice_topic_index_v2",
    async () => {
      return prisma.question.findMany({
        select: { subject: true, topic: true, subtopic: true, text: true, testSet: { select: { exam: true } } },
      });
    },
    600 // 10 minutes
  );

  // De-dupe identical question text within the same exam+subject+topic+subtopic
  // (the same content was seeded into multiple test sets).
  const seen = new Set<string>();
  // exam -> subject -> topic -> subtopic ("" = untagged) -> count
  const exams: Record<string, Record<string, Record<string, Record<string, number>>>> = {};

  for (const r of rows as any[]) {
    const exam = r.testSet.exam as string;
    const subject = r.subject as string;
    const topic = (r.topic as string | null) ?? "General";
    const subtopic = (r.subtopic as string | null) ?? "";
    const dedupeKey = `${exam}::${subject}::${topic}::${subtopic}::${r.text}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    exams[exam] ??= {};
    exams[exam][subject] ??= {};
    exams[exam][subject][topic] ??= {};
    exams[exam][subject][topic][subtopic] = (exams[exam][subject][topic][subtopic] ?? 0) + 1;
  }

  return Object.entries(exams).map(([exam, subjects]) => ({
    exam,
    subjects: Object.entries(subjects).map(([subject, topics]) => {
      const order = getTopicOrder(exam, subject);
      const rank = (topic: string) => {
        const i = order.indexOf(topic);
        return i === -1 ? order.length : i;
      };
      const topicGroups: TopicGroup[] = Object.entries(topics).map(([topic, subtopics]) => ({
        topic,
        count: Object.values(subtopics).reduce((a, b) => a + b, 0),
        subtopics: Object.entries(subtopics)
          .filter(([subtopic]) => subtopic !== "")
          .map(([subtopic, count]) => ({ subtopic, count }))
          // subtopic strings carry a numeric prefix like "1.1 " when present —
          // sorts correctly in curriculum order for free.
          .sort((a, b) => a.subtopic.localeCompare(b.subtopic, undefined, { numeric: true })),
      })).sort((a, b) => rank(a.topic) - rank(b.topic));

      return {
        subject,
        total: topicGroups.reduce((a, b) => a + b.count, 0),
        topics: topicGroups,
      };
    }).sort((a, b) => b.total - a.total),
  }));
}
