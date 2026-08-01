import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getPracticeIndex, getUserPracticeProgress, ProgressStats, TopicGroup } from "@/lib/practice-data";
import { getSubjectIcon, getSubjectColor } from "@/lib/subject-style";
import { SubtopicBrowser, UnitSectionData } from "@/components/subtopic-browser";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ exam: string; subject: string }>;
}

export default async function SubjectDetailPage({ params }: Props) {
  const { exam, subject } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=/practice/${exam}/${subject}`);

  const [examGroups, progress] = await Promise.all([
    getPracticeIndex(),
    getUserPracticeProgress(session.user.id),
  ]);
  const examGroup = examGroups.find((e) => e.exam === exam);
  const subjectGroup = examGroup?.subjects.find((s) => s.subject === subject);
  if (!subjectGroup) notFound();

  const Icon = getSubjectIcon(subject);
  const color = getSubjectColor(subject);

  const statsFor = (topic: string, subtopic: string): ProgressStats =>
    progress[`${exam}::${subject}::${topic}::${subtopic}`] ?? { answered: 0, correct: 0 };

  const topicStats = (t: TopicGroup): ProgressStats => {
    const keys = t.subtopics.length > 0 ? [...t.subtopics.map((s) => s.subtopic), ""] : [""];
    return keys.reduce(
      (acc, sk) => {
        const s = statsFor(t.topic, sk);
        return { answered: acc.answered + s.answered, correct: acc.correct + s.correct };
      },
      { answered: 0, correct: 0 }
    );
  };

  const subjectAnswered = subjectGroup.topics.reduce((sum, t) => sum + topicStats(t).answered, 0);

  const sections: UnitSectionData[] = subjectGroup.topics.map((t, ti) => {
    if (t.subtopics.length > 0) {
      return {
        topic: t.topic,
        unitNumber: ti + 1,
        cards: t.subtopics.map((st, si) => {
          const sStats = statsFor(t.topic, st.subtopic);
          return {
            key: `${t.topic}::${st.subtopic}`,
            topic: t.topic,
            label: st.subtopic.replace(/^\d+(?:\.\d+)?[a-z]?\.?\s*/i, ""),
            unitLabel: unitLabel(st.subtopic, ti, si),
            count: st.count,
            answered: sStats.answered,
            done: sStats.answered >= st.count && st.count > 0,
            href: `/practice/run?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(t.topic)}&subtopic=${encodeURIComponent(st.subtopic)}`,
          };
        }),
      };
    }
    const tStats = topicStats(t);
    return {
      topic: t.topic,
      unitNumber: ti + 1,
      cards: [
        {
          key: t.topic,
          topic: t.topic,
          label: t.topic,
          unitLabel: `${ti + 1}`,
          count: t.count,
          answered: tStats.answered,
          done: tStats.answered >= t.count && t.count > 0,
          href: `/practice/run?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(t.topic)}`,
        },
      ],
    };
  });

  return (
    <div className="container py-12 max-w-5xl">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/practice" className="hover:text-foreground transition">Practice</Link>
        <ChevronRight className="h-3 w-3" />
        <span>{exam}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{subject}</span>
      </div>

      <div className={cn("rounded-2xl border p-7 bg-gradient-to-br", color.from, color.to, color.ring)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className={cn("h-14 w-14 rounded-2xl bg-background/40 border inline-flex items-center justify-center shrink-0", color.ring)}>
              <Icon className={cn("h-7 w-7", color.text)} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">{exam}</p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{subject}</h1>
              <p className="text-sm text-muted-foreground mt-1">{subjectGroup.topics.length} topics · {subjectGroup.total} questions</p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link href={`/practice/run?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}`}>
              <Play className="h-4 w-4" /> {subjectAnswered > 0 ? "Resume" : "Practice all"} {subject}
            </Link>
          </Button>
        </div>
        {subjectAnswered > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>This week's progress <span className="opacity-60">· resets Monday</span></span>
              <span>{subjectAnswered}/{subjectGroup.total} · {Math.round((subjectAnswered / subjectGroup.total) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${Math.min(100, Math.round((subjectAnswered / subjectGroup.total) * 100))}%` }} />
            </div>
          </div>
        )}
      </div>

      <SubtopicBrowser sections={sections} subject={subject} />

      <Button variant="ghost" asChild className="mt-8">
        <Link href="/practice"><ArrowLeft className="h-4 w-4" /> Back to all subjects</Link>
      </Button>
    </div>
  );
}

function unitLabel(subtopic: string, topicIndex: number, subtopicIndex: number): string {
  const match = subtopic.match(/^(\d+(?:\.\d+)?)/);
  return match ? match[1] : `${topicIndex + 1}.${subtopicIndex + 1}`;
}
