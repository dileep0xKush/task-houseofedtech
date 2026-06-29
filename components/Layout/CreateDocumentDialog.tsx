"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateDocumentDialogProps {
  workspaceId: string;
}

export function CreateDocumentDialog({
  workspaceId,
}: CreateDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; workspaceId: string }) => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create document");
      return res.json().then((json) => json.data);
    },
    onSuccess: (document) => {
      setTitle("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
      router.push(`/dashboard/${workspaceId}/documents/${document.id}`);
    },
  });

  const handleCreate = () => {
    if (title.trim()) {
      createMutation.mutate({
        title: title.trim(),
        workspaceId,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Document</DialogTitle>
          <DialogDescription>
            Create a new document in this workspace
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            autoFocus
          />
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? "Creating..." : "Create Document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
