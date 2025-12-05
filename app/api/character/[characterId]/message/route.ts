import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Chat, GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;

  const chats = await prisma.message.findMany({
    where: {
      characterId,
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(chats);
};

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;
  const { content } = await req.json();
  const userId = session.user.id;

  const character = await prisma.character.findUnique({
    where: { id: characterId },
  });

  if (!character) {
    return NextResponse.json(
      { message: "Character not found!" },
      { status: 404 }
    );
  }

  const messages = await prisma.message.findMany({
    where: {
      characterId,
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let chat: Chat | undefined;

  // CHATLAAGUI BOL SETUP HIIH HESEG
  if (messages.length === 0) {
    chat = ai.chats.create({
      model: "gemini-2.0-flash",
      history: [
        { role: "user", parts: [{ text: character.basePrompt }] },
        { role: "model", parts: [{ text: character.greetingText }] },
      ],
    });
  } else {
    const history = [
      { role: "user", parts: [{ text: character.basePrompt }] },
      { role: "model", parts: [{ text: character.greetingText }] },
    ];

    messages.forEach((message) => {
      history.push({ role: message.role, parts: [{ text: message.content }] });
    });

    chat = ai.chats.create({
      model: "gemini-2.0-flash",
      history,
    });
  }

  const chatResponse = await chat.sendMessage({
    message: content,
  });
  await prisma.message.create({
    data: {
      character: {
        connect: {
          id: characterId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
      content,
      role: "user",
    },
  });
  await prisma.message.create({
    data: {
      character: {
        connect: {
          id: characterId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
      content: chatResponse.text!,
      role: "model",
    },
  });
  return NextResponse.json({ message: chatResponse.text! });
};
