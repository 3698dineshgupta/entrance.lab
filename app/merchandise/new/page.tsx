import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { NewMerchandiseForm } from "./new-merchandise-form";

export default async function NewMerchandisePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/merchandise/new");
  return <NewMerchandiseForm />;
}
