import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountClient } from "./account-client";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/account");

  return (
    <AccountClient
      name={session.user.name ?? null}
      email={session.user.email ?? ""}
      role={session.user.role}
    />
  );
}
