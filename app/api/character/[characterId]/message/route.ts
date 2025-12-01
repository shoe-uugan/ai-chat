import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) => {
  const { characterId } = await params;

  const chats = prisma.message.findMany({
    where: {
      characterId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(chats);
};

export const POST = async (req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) => {
  const { characterId } = await params;
  const { content }: Prisma.MessageCreateInput = await req.json();
  const createdMessage = prisma.message.create({
    data: {
      character: {
        connect: {
          id: characterId,
        },
      },
      content,
    },
  });
  return NextResponse.json(createdMessage);
};
