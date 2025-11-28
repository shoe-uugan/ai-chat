import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async () => {
  const characters = await prisma.character.findMany({});
  return NextResponse.json(characters);
};

export const POST = async (req: NextRequest) => {
  const data: Prisma.CharacterCreateInput = await req.json();
  const character = await prisma.character.create({
    data,
  });
  return NextResponse.json(character);
};
