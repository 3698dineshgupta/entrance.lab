import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/redis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TestInterface } from "@/components/test-interface";
import { MOCK_TESTS } from "@/lib/questions";

interface Props {
  params: Promise<{ id: string }>;
}

// Desired subject sequence per exam — questions are grouped and ordered
// by this before being handed to the client, since the DB fetch has no
// guaranteed ordering.
const SUBJECT_ORDER: Record<string, string[]> = {
  CEE: ["Physics", "Chemistry", "Botany", "Zoology", "MAT"],
};

function sortBySubject<T extends { subject: string }>(questions: T[], exam: string): T[] {
  const order = SUBJECT_ORDER[exam] ?? [];
  const priority = (subject: string) => {
    const i = order.indexOf(subject);
    return i === -1 ? order.length : i;
  };
  return [...questions].sort((a, b) => priority(a.subject) - priority(b.subject));
}

export default async function TestPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/test/" + id);

  const test = await fetchWithCache(
    `test_set_${id}`,
    async () => {
      let dbTest = await prisma.testSet.findUnique({
        where: { id },
        include: {
          questions: {
            select: { id: true, subject: true, text: true, options: true, correctIndex: true, explanation: true, marks: true, negativeMarks: true }
          }
        }
      });

      // Fallback for hardcoded slugs (like ioe-full-1) matching the database titles
      if (!dbTest) {
        const hardcoded = MOCK_TESTS.find(t => t.id === id);
        if (hardcoded) {
          dbTest = await prisma.testSet.findFirst({
            where: { title: hardcoded.title },
            include: {
              questions: {
                select: { id: true, subject: true, text: true, options: true, correctIndex: true, explanation: true, marks: true, negativeMarks: true }
              }
            }
          });
        }
      }
      return dbTest;
    },
    3600 // cache for 1 hour, test sets rarely change once published
  );

  if (!test) notFound();

  const mockTest = {
    ...test,
    questions: sortBySubject(
      test.questions.map(q => ({
        ...q,
        options: q.options as string[]
      })),
      test.exam
    )
  };

  return <TestInterface test={mockTest as any} />;
}
