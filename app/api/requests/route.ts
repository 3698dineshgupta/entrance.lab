import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public — the Request Hub form works whether the visitor is logged in or
// not, so a missing session isn't an error here.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { name, whatsapp, message } = await req.json();

  if (!name?.trim() || !whatsapp?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, WhatsApp number, and message are all required." }, { status: 400 });
  }
  if (!/^[+\d][\d\s-]{6,}$/.test(whatsapp.trim())) {
    return NextResponse.json({ error: "Enter a valid WhatsApp number." }, { status: 400 });
  }

  const request = await prisma.materialRequest.create({
    data: {
      userId: session?.user?.id ?? null,
      name: name.trim().slice(0, 100),
      whatsapp: whatsapp.trim().slice(0, 30),
      message: message.trim().slice(0, 2000),
    },
    select: { id: true },
  });

  return NextResponse.json({ success: true, id: request.id });
}
