"use client";

import { useEffect, useState } from "react";
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

export default function ChatroomPage() {
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
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Select a Character to Chat</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {session.user?.name || session.user?.email}</span>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <div
              key={character.id}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCharacter(character)}
            >
              <Image
                src={character.image}
                alt={character.name}
                width={100}
                height={100}
                className="object-cover rounded mb-2"
              />
              <h2 className="text-lg font-semibold">{character.name}</h2>
              <p className="text-sm text-gray-600">{character.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={() => setSelectedCharacter(null)}>
          Back to Characters
        </Button>
        <div className="flex items-center gap-4">
          <span>Welcome, {session.user?.name || session.user?.email}</span>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
      <div className="flex items-center mb-4 flex-col">
        <div className="pt-5">
          <Image
            src={selectedCharacter.image}
            alt={selectedCharacter.name}
            width={70}
            height={70}
            className="object-cover rounded mb-2"
          />
        </div>
        <h1 className="text-2xl font-bold ml-4">
          Chat with {selectedCharacter.name}
        </h1>
      </div>
      <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 mr-2"
        />
        <Button onClick={sendMessage} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
