import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async () => {
  try {
    const characters = await prisma.character.findMany({});
    return NextResponse.json(characters);
  } catch (error) {
    console.error("Error fetching characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const data: Prisma.CharacterCreateInput = await req.json();
    const character = await prisma.character.create({
      data,
    });
    return NextResponse.json(character);
  } catch (error) {
    console.error("Error creating character:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    );
  }
};
