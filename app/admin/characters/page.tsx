"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin - Characters</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Character</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
              <DialogDescription>
                Add a new character to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" required />
              </div>
              <div>
                <Label htmlFor="basePrompt">Base Prompt</Label>
                <textarea
                  id="basePrompt"
                  name="basePrompt"
                  required
                  className="w-full p-2 border rounded"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="greetingText">Greeting Text</Label>
                <textarea
                  id="greetingText"
                  name="greetingText"
                  required
                  className="w-full p-2 border rounded"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  required
                />
              </div>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Character</DialogTitle>
              <DialogDescription>
                Update the character details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmitEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCharacter?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editingCharacter?.description}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-basePrompt">Base Prompt</Label>
                <textarea
                  id="edit-basePrompt"
                  name="basePrompt"
                  defaultValue={editingCharacter?.basePrompt}
                  required
                  className="w-full p-2 border rounded"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-greetingText">Greeting Text</Label>
                <textarea
                  id="edit-greetingText"
                  name="greetingText"
                  defaultValue={editingCharacter?.greetingText}
                  required
                  className="w-full p-2 border rounded"
                  rows={4}
                />
              </div>
              <div>
                <Label>Current Image</Label>
                {editingCharacter && (
                  <Image
                    src={editingCharacter.image}
                    alt={editingCharacter.name}
                    width={100}
                    height={100}
                    className="object-cover rounded"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="edit-image">New Image (optional)</Label>
                <Input
                  id="edit-image"
                  name="image"
                  type="file"
                  accept="image/*"
                />
              </div>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Updating..." : "Update"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {characters.map((character) => (
            <TableRow key={character.id}>
              <TableCell>
                <Image
                  src={character.image}
                  alt={character.name}
                  width={50}
                  height={50}
                  className="object-cover rounded"
                />
              </TableCell>
              <TableCell>{character.name}</TableCell>
              <TableCell>{character.description}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/?characterId=${character.id}`)}
                >
                  Chat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCharacter(character);
                    setEditDialogOpen(true);
                  }}
                >
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
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
