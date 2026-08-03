import { prisma } from "@/lib/prisma";
import { deleteExpiredSoldListings } from "@/lib/merchandise";
import { MerchandiseBrowser } from "./merchandise-browser";

export const dynamic = "force-dynamic";

export default async function MerchandisePage() {
  await deleteExpiredSoldListings();

  const listings = await prisma.merchandiseListing.findMany({
    where: { status: { in: ["approved", "sold"] } },
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
      createdAt: true,
    },
  });

  return <MerchandiseBrowser listings={listings as any} />;
}
