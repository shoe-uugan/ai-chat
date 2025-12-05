"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { MessageCircle, Edit, Trash2, Plus } from "lucide-react";

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  basePrompt: string;
  greetingText: string;
}

export default function AdminCharactersPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/character");
      const data = await response.json();
      setCharacters(data);
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacter = async (id: string) => {
    try {
      const response = await fetch(`/api/character/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchCharacters();
      } else {
        alert("Failed to delete character");
      }
    } catch (error) {
      console.error("Failed to delete character:", error);
      alert("Failed to delete character");
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const basePrompt = formData.get("basePrompt") as string;
      const greetingText = formData.get("greetingText") as string;
      const imageFile = formData.get("image") as File;

      if (!name || !description || !basePrompt || !greetingText || !imageFile) {
        alert("All fields are required");
        return;
      }

      // Upload image first
      const imageUrl = await uploadImage(imageFile);

      // Create character
      const response = await fetch("/api/character", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          image: imageUrl,
          basePrompt,
          greetingText,
        }),
      });

      if (response.ok) {
        await fetchCharacters();
        setDialogOpen(false);
        (event.target as HTMLFormElement).reset();
      } else {
        alert("Failed to create character");
      }
    } catch (error) {
      console.error("Failed to create character:", error);
      alert("Failed to create character");
    } finally {
      setUploading(false);
    }
  };

  const onSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const basePrompt = formData.get("basePrompt") as string;
      const greetingText = formData.get("greetingText") as string;
      const imageFile = formData.get("image") as File;

      let imageUrl = editingCharacter!.image;

      if (imageFile && imageFile.size > 0) {
        // Upload new image
        imageUrl = await uploadImage(imageFile);
      }

      // Update character
      const response = await fetch(`/api/character/${editingCharacter!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          image: imageUrl,
          basePrompt,
          greetingText,
        }),
      });

      if (response.ok) {
        await fetchCharacters();
        setEditDialogOpen(false);
        setEditingCharacter(null);
      } else {
        alert("Failed to update character");
      }
    } catch (error) {
      console.error("Failed to update character:", error);
      alert("Failed to update character");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Admin - Characters
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Create New Character
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  Add a new character to the system.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="basePrompt" className="text-white">
                    Base Prompt
                  </Label>
                  <textarea
                    id="basePrompt"
                    name="basePrompt"
                    required
                    className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="greetingText" className="text-white">
                    Greeting Text
                  </Label>
                  <textarea
                    id="greetingText"
                    name="greetingText"
                    required
                    className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="image" className="text-white">
                    Image
                  </Label>
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? "Creating..." : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Character</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Update the character details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmitEdit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-white">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingCharacter?.name}
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-white">
                    Description
                  </Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={editingCharacter?.description}
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-basePrompt" className="text-white">
                    Base Prompt
                  </Label>
                  <textarea
                    id="edit-basePrompt"
                    name="basePrompt"
                    defaultValue={editingCharacter?.basePrompt}
                    required
                    className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-greetingText" className="text-white">
                    Greeting Text
                  </Label>
                  <textarea
                    id="edit-greetingText"
                    name="greetingText"
                    defaultValue={editingCharacter?.greetingText}
                    required
                    className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                    rows={4}
                  />
                </div>
                <div>
                  <Label className="text-white">Current Image</Label>
                  {editingCharacter && (
                    <Image
                      src={editingCharacter.image}
                      alt={editingCharacter.name}
                      width={100}
                      height={100}
                      className="object-cover rounded mt-2"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-image" className="text-white">
                    New Image (optional)
                  </Label>
                  <Input
                    id="edit-image"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? "Updating..." : "Update"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <div
              key={character.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-700 overflow-hidden"
            >
              <div className="h-48 flex items-center justify-center bg-gray-700 overflow-hidden">
                <Image
                  src={character.image}
                  alt={character.name}
                  width={400}
                  height={192}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  {character.name}
                </h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {character.description.length > 100
                    ? `${character.description.substring(0, 100)}...`
                    : character.description}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/?characterId=${character.id}`)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Chat
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingCharacter(character);
                      setEditDialogOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this character?"
                        )
                      )
                        deleteCharacter(character.id);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
