"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  basePrompt: string;
  greetingText: string;
}

interface Message {
  id: string;
  content: string;
  role: string;
  createdAt: string;
}

function ChatroomContent() {
  const { data: session, status } = useSession();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/character");
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedCharacter) return;
    try {
      const response = await fetch(
        `/api/character/${selectedCharacter.id}/message`
      );
      if (response.ok) {
        const data = await response.json();
        // Always start with greeting message
        const messages = [
          {
            id: "greeting",
            content: selectedCharacter.greetingText,
            role: "model",
            createdAt: new Date().toISOString(),
          },
          ...data, // Add any existing conversation messages
        ];
        setMessages(messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    if (characters.length > 0) {
      const characterId = searchParams.get("characterId");
      if (characterId) {
        const character = characters.find((c) => c.id === characterId);
        if (character) {
          setSelectedCharacter(character);
        }
      }
    }
  }, [characters, searchParams]);

  useEffect(() => {
    if (selectedCharacter) {
      fetchMessages();
    }
  }, [selectedCharacter]);

  if (status === "loading") {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!session) {
    return null; // Will redirect
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedCharacter || loading) return;
    setLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch(
        `/api/character/${selectedCharacter.id}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: userMessage.content }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          role: "model",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-grey-900 to-slate-800">
        <div className="shadow-2xl pl-10 pr-10 pt-6 pb-8 bg-black/20 backdrop-blur-sm w-full flex justify-between items-center mb-8 border-b border-white/10">
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-grey-400 to-grey-500 bg-clip-text text-transparent">
            ⎋ CharacterHub
          </h1>
          <div className="flex items-center gap-4 text-white">
            <span className="text-sm opacity-90">
              Welcome, {session.user?.name || session.user?.email}
            </span>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-white px-10 pb-10">
          {characters.map((character) => (
            <div
              key={character.id}
              className="group shadow-2xl shadow-black/50 rounded-xl p-5 cursor-pointer hover:shadow-grey-500/20 hover:scale-105 transition-all duration-300 text-white bg-gradient-to-br from-stone-800 to-stone-900 border border-white/10 hover:border-grey-500/30"
              onClick={() => setSelectedCharacter(character)}
            >
              <div className="relative overflow-hidden rounded-lg mb-4">
                <Image
                  src={character.image}
                  alt={character.name}
                  width={500}
                  height={500}
                  className="object-cover w-full h-48 group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-grey-300 transition-colors">
                {character.name}
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                {character.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  export default function ChatroomPage() {
    return (
      <Suspense
        fallback={<div className="container mx-auto py-8">Loading...</div>}
      >
        <ChatroomContent />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-grey-900 to-slate-800 flex flex-col">
      <div className="shadow-2xl px-6 py-4 bg-black/20 backdrop-blur-sm flex justify-between items-center border-b border-white/10">
        <Button
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
          onClick={() => setSelectedCharacter(null)}
        >
          ← Back to Characters
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white opacity-90">
            Welcome, {session.user?.name || session.user?.email}
          </span>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
            <Image
              src={selectedCharacter.image}
              alt={selectedCharacter.name}
              width={50}
              height={50}
              className="object-cover rounded-full mr-4 border-2 border-grey-500"
            />
            <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-grey-400 to-grey-500 bg-clip-text text-transparent">
              Chat with {selectedCharacter.name}
            </h1>
          </div>
        </div>

        <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 px-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-lg ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-grey-500 to-grey-600 text-white rounded-br-sm"
                      : "bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-bl-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-4 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-grey-500 focus:ring-grey-500"
          />
          <Button
            onClick={sendMessage}
            disabled={loading}
            className="bg-gradient-to-r from-grey-500 to-grey-600 hover:from-grey-600 hover:to-grey-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-grey-500/25 transition-all"
          >
            {loading ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
