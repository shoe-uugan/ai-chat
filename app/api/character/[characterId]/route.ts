import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const PUT = async (req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) => {
  const { characterId } = await params;
  const data: Prisma.CharacterUpdateInput = await req.json();
  try {
    const character = await prisma.character.update({
      where: { id: characterId },
      data,
    });
    return NextResponse.json(character);
  } catch (error) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) => {
  const { characterId } = await params;
  try {
    await prisma.character.delete({
      where: { id: characterId },
    });
    return NextResponse.json({ message: "Character deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
};
