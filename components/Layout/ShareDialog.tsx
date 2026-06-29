"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Share2, X, Trash2, Copy, Check } from "lucide-react";

interface DocumentMember {
  id: string;
  userId: string;
  documentId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ShareDialogProps {
  documentId: string;
  workspaceId: string;
  documentTitle: string;
}

export function ShareDialog({ documentId, workspaceId, documentTitle }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: members = [], refetch } = useQuery({
    queryKey: ["document-members", documentId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${documentId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json().then((data) => data.data);
    },
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: searchEmail,
          role: selectedRole,
        }),
      });

      if (!res.ok) throw new Error("Failed to add member");

      setSearchEmail("");
      refetch();
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Failed to remove member");
      refetch();
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const copyShareLink = async () => {
    const link = `${window.location.origin}/dashboard/${workspaceId}/documents/${documentId}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-500/20 text-purple-600 dark:text-purple-400";
      case "EDITOR":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
      case "VIEWER":
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle>Share "{documentTitle}"</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Share Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/dashboard/${workspaceId}/documents/${documentId}`}
                    className="text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyShareLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Add Member */}
              <form onSubmit={handleAddMember} className="space-y-2">
                <label className="text-sm font-medium">Add People</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="user@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    type="email"
                  />
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as "EDITOR" | "VIEWER")
                    }
                    className="px-3 py-2 rounded-md border border-border text-sm bg-background"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <Button type="submit" disabled={!searchEmail || loading}>
                    Add
                  </Button>
                </div>
              </form>

              {/* Current Members */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Collaborators ({members.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.map((member: DocumentMember) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        {member.role !== "OWNER" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="h-6 w-6 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
