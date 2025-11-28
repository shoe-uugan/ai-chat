"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
}

export default function AdminCharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      const imageFile = formData.get("image") as File;

      if (!name || !description || !imageFile) {
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
              <DialogDescription>Add a new character to the system.</DialogDescription>
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
                <Label htmlFor="image">Image</Label>
                <Input id="image" name="image" type="file" accept="image/*" required />
              </div>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Image</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {characters.map((character) => (
            <TableRow key={character.id}>
              <TableCell>{character.id}</TableCell>
              <TableCell>{character.name}</TableCell>
              <TableCell>{character.description}</TableCell>
              <TableCell>
                <Image src={character.image} alt={character.name} width={50} height={50} className="object-cover rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
