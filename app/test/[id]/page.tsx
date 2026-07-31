import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/redis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TestInterface } from "@/components/test-interface";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/test/" + id);

  const test = await fetchWithCache(
    `test_set_${id}`,
    async () => {
      return await prisma.testSet.findUnique({
        where: { id },
        include: {
          questions: {
            select: {
              id: true,
              subject: true,
              text: true,
              options: true,
              marks: true,
              negativeMarks: true,
            }
          }
        }
      });
    },
    3600 // cache for 1 hour, test sets rarely change once published
  );

  if (!test) notFound();

  const mockTest = {
    ...test,
    questions: test.questions.map(q => ({
      ...q,
      options: q.options as string[]
    }))
  };

  return <TestInterface test={mockTest as any} />;
}
