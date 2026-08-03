import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyListings } from "./my-listings";

export const dynamic = "force-dynamic";

export default async function MyMerchandisePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/merchandise/mine");

  const listings = await prisma.merchandiseListing.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      category: true,
      whatsapp: true,
      imageUrl: true,
      status: true,
      soldAt: true,
      createdAt: true,
    },
  });

  return <MyListings listings={listings as any} />;
}
