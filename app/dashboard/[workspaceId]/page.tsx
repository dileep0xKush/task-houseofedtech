"use client";

import { useParams } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateDocumentDialog } from "@/components/Layout/CreateDocumentDialog";
import { extractTextPreview, formatDate } from "@/lib/content-utils";

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [searchQuery, setSearchQuery] = useState("");
  const { setCurrentWorkspace } = useAppStore();

  // Set current workspace
  useEffect(() => {
    setCurrentWorkspace(workspaceId);
  }, [workspaceId, setCurrentWorkspace]);

  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch workspace");
      return res.json().then((data) => data.data);
    },
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/documents?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json().then((data) => data.data);
    },
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["search", workspaceId, searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&workspaceId=${workspaceId}`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json().then((data) => data.data.results);
    },
    enabled: !!searchQuery,
  });

  const displayedDocuments = searchQuery ? searchResults : documents;
  const isLoading = workspaceLoading || docsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
      <div className="container max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                {workspace.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-muted-foreground">
                  {documents.length} document{documents.length !== 1 ? "s" : ""} • Last updated today
                </p>
              </div>
            </div>
            <CreateDocumentDialog workspaceId={workspaceId} />
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/30 border-border/30 focus:border-blue-500/30"
            />
          </div>
        </div>

        {displayedDocuments.length === 0 ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <Card className="border-border/30 w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
                  <FileText className="h-12 w-12 text-blue-500/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No documents found" : "No documents yet"}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6 text-sm">
                  {searchQuery
                    ? "Try a different search term or create a new document"
                    : "Create your first document to start collaborating"}
                </p>
                {!searchQuery && <CreateDocumentDialog workspaceId={workspaceId} />}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedDocuments.map((doc: any) => (
              <Link
                key={doc.id}
                href={`/dashboard/${workspaceId}/documents/${doc.id}`}
                className="group"
              >
                <Card className="h-full cursor-pointer hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 border-border/30 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                        <FileText className="h-5 w-5" />
                      </div>
                      <span className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {doc.title}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {extractTextPreview(doc.content, 100)}
                    </p>
                    <div className="pt-4 border-t border-border/20 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDate(doc.updatedAt)}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-green-500/50 group-hover:bg-green-500 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
