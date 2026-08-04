import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MerchandiseForm } from "@/components/merchandise-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMerchandisePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=/merchandise/${id}/edit`);

  const listing = await prisma.merchandiseListing.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      price: true,
      category: true,
      whatsapp: true,
      imageUrl: true,
      status: true,
    },
  });

  if (!listing) notFound();
  // Owner only — no IDOR: a user can't reach another user's edit form by
  // guessing/changing the id in the URL.
  if (listing.userId !== session.user.id) notFound();
  if (listing.status === "sold") redirect("/merchandise/mine");

  return (
    <MerchandiseForm
      editListing={{
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        whatsapp: listing.whatsapp,
        imageUrl: listing.imageUrl,
      }}
    />
  );
}
