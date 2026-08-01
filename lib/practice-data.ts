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

// Start of the current practice week (Monday 00:00 UTC). Progress and
// resume-priority are both scoped to this window so a question answered
// last week becomes fresh again this week, without deleting the underlying
// PracticeAttempt history.
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = (day + 6) % 7; // days since the most recent Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
  return monday;
}

export interface ProgressStats {
  answered: number;
  correct: number;
}

// Per-(exam, subject, topic, subtopic) progress for one user, scoped to the
// current practice week. Keyed by `${exam}::${subject}::${topic}::${subtopic
// ?? ""}` — an empty subtopic key aggregates answers to questions that don't
// have subtopic-level tagging. Deliberately not cached (per-user, changes on
// every answer) — the query itself is cheap since it's indexed on userId.
export async function getUserPracticeProgress(userId: string): Promise<Record<string, ProgressStats>> {
  const rows = await prisma.practiceAttempt.findMany({
    where: { userId, answeredAt: { gte: getCurrentWeekStart() } },
    select: {
      correct: true,
      question: { select: { subject: true, topic: true, subtopic: true, testSet: { select: { exam: true } } } },
    },
  });

  const map: Record<string, ProgressStats> = {};
  for (const r of rows) {
    const exam = r.question.testSet.exam;
    const subject = r.question.subject;
    const topic = r.question.topic ?? "General";
    const subtopic = r.question.subtopic ?? "";
    const key = `${exam}::${subject}::${topic}::${subtopic}`;
    map[key] ??= { answered: 0, correct: 0 };
    map[key].answered += 1;
    if (r.correct) map[key].correct += 1;
  }
  return map;
}
