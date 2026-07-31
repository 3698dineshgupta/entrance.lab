import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPracticeIndex } from "@/lib/practice-data";
import { PracticeBrowser } from "./practice-browser";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/practice");

  const examGroups = await getPracticeIndex();

  return <PracticeBrowser examGroups={examGroups} />;
}
