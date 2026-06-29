"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Workspace, CreateWorkspaceInput } from "@/types";

export function useWorkspaces() {
  const queryClient = useQueryClient();

  const { data: workspaces = [], isLoading, error } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      const data = await res.json();
      return data.data as Workspace[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create workspace");
      return res.json();
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  return {
    workspaces,
    isLoading,
    error,
    createWorkspace: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
