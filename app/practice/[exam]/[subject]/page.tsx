import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getPracticeIndex, getUserPracticeProgress, ProgressStats, TopicGroup } from "@/lib/practice-data";
import { getSubtopics } from "@/lib/syllabus";
import { getSubjectIcon, getSubjectColor } from "@/lib/subject-style";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ChevronRight, Play, CheckCircle2 } from "lucide-react";
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

      <div className="mt-8 space-y-4">
        {subjectGroup.topics.map((t) => {
          const referenceSubtopics = t.subtopics.length === 0 ? getSubtopics(exam, subject, t.topic) : [];
          const tStats = topicStats(t);
          const tPct = t.count > 0 ? Math.min(100, Math.round((tStats.answered / t.count) * 100)) : 0;
          const tDone = tStats.answered >= t.count && t.count > 0;
          return (
            <Card key={t.topic} className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{t.topic}</h2>
                    {tDone && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.count} questions{t.subtopics.length > 0 ? ` · ${t.subtopics.length} subtopics` : ""}
                    {tStats.answered > 0 && <> · <span className={tDone ? "text-green-400" : "text-cyan-400"}>{tStats.answered}/{t.count} done ({tPct}%)</span></>}
                  </p>
                  {tStats.answered > 0 && (
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mt-2 max-w-xs">
                      <div className={cn("h-full", tDone ? "bg-green-400" : "bg-cyan-400")} style={{ width: `${tPct}%` }} />
                    </div>
                  )}
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/practice/run?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(t.topic)}`}>
                    {tStats.answered > 0 ? "Resume" : "Practice all"} {t.topic} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {t.subtopics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {t.subtopics.map((st) => {
                    const sStats = statsFor(t.topic, st.subtopic);
                    const sPct = st.count > 0 ? Math.min(100, Math.round((sStats.answered / st.count) * 100)) : 0;
                    const sDone = sStats.answered >= st.count && st.count > 0;
                    return (
                      <Link
                        key={st.subtopic}
                        href={`/practice/run?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(t.topic)}&subtopic=${encodeURIComponent(st.subtopic)}`}
                        className={cn(
                          "group flex flex-col gap-1.5 rounded-lg border px-3.5 py-2.5 transition",
                          sDone ? "border-green-400/25 bg-green-500/[0.04] hover:border-green-400/50"
                            : "border-white/[0.07] bg-white/[0.015] hover:border-cyan-400/40 hover:bg-cyan-500/[0.04]"
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm inline-flex items-center gap-1.5">
                            {sDone && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />}
                            {st.subtopic.replace(/^\d+(\.\d+)?\s*/, "")}
                          </span>
                          <span className="shrink-0 flex items-center gap-1.5 text-muted-foreground">
                            <span className="text-[10px] font-mono">{sStats.answered > 0 ? `${sStats.answered}/${st.count}` : st.count}</span>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400 transition" />
                          </span>
                        </span>
                        {sStats.answered > 0 && (
                          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className={cn("h-full", sDone ? "bg-green-400" : "bg-cyan-400")} style={{ width: `${sPct}%` }} />
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {referenceSubtopics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Syllabus coverage</p>
                  <div className="flex flex-wrap gap-1.5">
                    {referenceSubtopics.map((st) => (
                      <span key={st} className="text-[10px] leading-none px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-muted-foreground">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button variant="ghost" asChild className="mt-8">
        <Link href="/practice"><ArrowLeft className="h-4 w-4" /> Back to all subjects</Link>
      </Button>
    </div>
  );
}
