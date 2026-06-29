"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, UpdateDocumentInput } from "@/types";

export function useDocument(documentId: string) {
  const queryClient = useQueryClient();

  const { data: document, isLoading, error, refetch } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error("Failed to fetch document");
      const data = await res.json();
      return data.data as Document;
    },
    enabled: !!documentId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: UpdateDocumentInput) => {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update document");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["document", documentId], data.data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["document", documentId] });
    },
  });

  return {
    document,
    isLoading,
    error,
    updateDocument: updateMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch,
  };
}
