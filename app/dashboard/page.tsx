"use client";

import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Folder, FileText, Share2, Calendar, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreateWorkspaceDialog } from "@/components/Layout/CreateWorkspaceDialog";
import { extractTextPreview } from "@/lib/content-utils";

export default function Dashboard() {
  const { workspaces, isLoading } = useWorkspaces();
  const { setWorkspaces, setCurrentWorkspace } = useAppStore();
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);

  // Fetch all documents (includes shared documents)
  const { data: allDocuments = [] } = useQuery({
    queryKey: ["all-documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json().then((data) => data.data);
    },
  });

  // Filter shared documents (those where user is a document member but not workspace owner)
  useEffect(() => {
    if (allDocuments.length > 0 && workspaces.length > 0) {
      const shared = allDocuments.filter((doc: any) => {
        // Document is shared if it has members (documentMembers)
        return doc.members && doc.members.length > 0;
      });
      setSharedDocs(shared);
    }
  }, [allDocuments, workspaces]);

  useEffect(() => {
    if (workspaces.length > 0) {
      setWorkspaces(workspaces);
      if (!useAppStore.getState().currentWorkspaceId) {
        setCurrentWorkspace(workspaces[0].id);
      }
    }
  }, [workspaces]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading workspaces...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Workspaces</h1>
            <p className="text-muted-foreground">
              Access and manage your collaborative workspaces
            </p>
          </div>
          <CreateWorkspaceDialog />
        </div>

        {workspaces.length === 0 ? (
          <Card className="border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Create your first workspace to get started with KnowledgeSync
              </p>
              <CreateWorkspaceDialog />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {workspaces.map((workspace) => (
                <Link key={workspace.id} href={`/dashboard/${workspace.id}`}>
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5" />
                        {workspace.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Documents
                        </div>
                        <p className="text-xs">
                          Created {new Date(workspace.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Shared Documents Section */}
            {sharedDocs.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Share2 className="h-6 w-6" />
                    Shared with Me
                  </h2>
                  <p className="text-muted-foreground">
                    Documents that have been shared by others
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sharedDocs.map((doc: any) => (
                    <Link
                      key={doc.id}
                      href={`/dashboard/${doc.workspaceId}/documents/${doc.id}`}
                    >
                      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-4 w-4" />
                            {doc.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {extractTextPreview(doc.content, 100)}
                            </p>
                            <div className="pt-2 border-t border-border/30 space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(doc.updatedAt).toLocaleDateString()}
                              </div>
                              {doc.members && doc.members.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  Shared by: {doc.members[0].user.name || doc.members[0].user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
