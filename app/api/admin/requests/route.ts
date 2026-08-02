import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.materialRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      whatsapp: true,
      message: true,
      status: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  });

  return NextResponse.json(requests);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  if (!id || !["pending", "fulfilled"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await prisma.materialRequest.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });

  return NextResponse.json(updated);
}
