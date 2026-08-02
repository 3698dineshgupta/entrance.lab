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
  // Cache the fully-computed grouping, not just the raw rows — this table
  // has 7,000+ questions, and re-running the dedupe/group/sort pass on every
  // request (even on a cache hit) was the single biggest contributor to
  // /practice and /practice/[exam]/[subject] feeling slow.
  return fetchWithCache(
    "practice_topic_index_v3",
    async () => {
      const rows = await prisma.question.findMany({
        select: { subject: true, topic: true, subtopic: true, text: true, testSet: { select: { exam: true } } },
      });

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
    },
    600 // 10 minutes
  );
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

// ─── Mock-test readiness ────────────────────────────────────────────────────
// A different question from weekly resume progress: "across everything
// they've ever practiced, how much of the syllabus have they covered, and
// how accurately?" Used to tell a user whether they've practiced enough of
// a subject/exam to be worth attempting a real mock test.

export type ReadinessStatus = "not-started" | "started" | "in-progress" | "ready";

export interface SubjectReadiness {
  subject: string;
  total: number;
  attempted: number;
  correct: number;
  coverage: number; // 0-100, % of the subject's questions attempted at least once (all-time)
  accuracy: number; // 0-100, % of attempted questions answered correctly (most recent answer)
  status: ReadinessStatus;
}

export interface ExamReadiness {
  exam: string;
  total: number;
  attempted: number;
  correct: number;
  coverage: number;
  accuracy: number;
  ready: boolean;
  subjects: SubjectReadiness[];
}

const READY_COVERAGE_THRESHOLD = 70;
const READY_ACCURACY_THRESHOLD = 60;
const IN_PROGRESS_COVERAGE_THRESHOLD = 35;

function statusFor(attempted: number, coverage: number, accuracy: number): ReadinessStatus {
  if (attempted === 0) return "not-started";
  if (coverage >= READY_COVERAGE_THRESHOLD && accuracy >= READY_ACCURACY_THRESHOLD) return "ready";
  if (coverage >= IN_PROGRESS_COVERAGE_THRESHOLD) return "in-progress";
  return "started";
}

// All-time (not week-scoped, unlike getUserPracticeProgress) so readiness
// reflects the user's full practice history, not just this week's resets.
export async function getUserPracticeReadiness(userId: string): Promise<ExamReadiness[]> {
  const [index, attempts] = await Promise.all([
    getPracticeIndex(),
    prisma.practiceAttempt.findMany({
      where: { userId },
      select: { correct: true, question: { select: { subject: true, testSet: { select: { exam: true } } } } },
    }),
  ]);

  const progress: Record<string, { attempted: number; correct: number }> = {};
  for (const a of attempts) {
    const key = `${a.question.testSet.exam}::${a.question.subject}`;
    progress[key] ??= { attempted: 0, correct: 0 };
    progress[key].attempted += 1;
    if (a.correct) progress[key].correct += 1;
  }

  return index.map((examGroup) => {
    const subjects: SubjectReadiness[] = examGroup.subjects.map((s) => {
      const p = progress[`${examGroup.exam}::${s.subject}`] ?? { attempted: 0, correct: 0 };
      // Clamp: a subject's `total` is deduped by question text, but
      // PracticeAttempt rows are keyed by questionId, so a small mismatch
      // between duplicate-seeded copies can theoretically push the raw
      // attempted count slightly past total — clamp rather than show >100%.
      const attempted = Math.min(p.attempted, s.total);
      const coverage = s.total > 0 ? Math.round((attempted / s.total) * 100) : 0;
      const accuracy = p.attempted > 0 ? Math.round((p.correct / p.attempted) * 100) : 0;
      return {
        subject: s.subject,
        total: s.total,
        attempted,
        correct: p.correct,
        coverage,
        accuracy,
        status: statusFor(attempted, coverage, accuracy),
      };
    }).sort((a, b) => b.total - a.total);

    const total = subjects.reduce((sum, s) => sum + s.total, 0);
    const attempted = subjects.reduce((sum, s) => sum + s.attempted, 0);
    const correct = subjects.reduce((sum, s) => sum + s.correct, 0);
    const coverage = total > 0 ? Math.round((attempted / total) * 100) : 0;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    return {
      exam: examGroup.exam,
      total,
      attempted,
      correct,
      coverage,
      accuracy,
      ready: attempted > 0 && coverage >= READY_COVERAGE_THRESHOLD && accuracy >= READY_ACCURACY_THRESHOLD,
      subjects,
    };
  });
}
