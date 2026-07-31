import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getPracticeIndex } from "@/lib/practice-data";
import { getSubtopics } from "@/lib/syllabus";
import { getSubjectIcon, getSubjectColor } from "@/lib/subject-style";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ exam: string; subject: string }>;
}

export default async function SubjectDetailPage({ params }: Props) {
  const { exam, subject } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=/practice/${exam}/${subject}`);

  const examGroups = await getPracticeIndex();
  const examGroup = examGroups.find((e) => e.exam === exam);
  const subjectGroup = examGroup?.subjects.find((s) => s.subject === subject);
  if (!subjectGroup) notFound();

  const Icon = getSubjectIcon(subject);
  const color = getSubjectColor(subject);

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
              <Play className="h-4 w-4" /> Practice all {subject}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {subjectGroup.topics.map((t) => {
          const referenceSubtopics = t.subtopics.length === 0 ? getSubtopics(exam, subject, t.topic) : [];
          return (
            <Card key={t.topic} className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-base font-semibold">{t.topic}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.count} questions{t.subtopics.length > 0 ? ` · ${t.subtopics.length} subtopics` : ""}</p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/practice/run?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(t.topic)}`}>
                    Practice all {t.topic} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {t.subtopics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {t.subtopics.map((st) => (
                    <Link
                      key={st.subtopic}
                      href={`/practice/run?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(t.topic)}&subtopic=${encodeURIComponent(st.subtopic)}`}
                      className="group flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.015] px-3.5 py-2.5 hover:border-cyan-400/40 hover:bg-cyan-500/[0.04] transition"
                    >
                      <span className="text-sm">{st.subtopic.replace(/^\d+(\.\d+)?\s*/, "")}</span>
                      <span className="shrink-0 flex items-center gap-1.5 text-muted-foreground">
                        <span className="text-[10px] font-mono">{st.count}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400 transition" />
                      </span>
                    </Link>
                  ))}
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
