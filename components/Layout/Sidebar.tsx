"use client";

import { useAppStore } from "@/store/app-store";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { CreateDocumentDialog } from "./CreateDocumentDialog";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

export function Sidebar() {
  const { documents, currentWorkspaceId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  if (!currentWorkspaceId) {
    return (
      <aside className="w-72 border-r border-border/40 bg-gradient-to-b from-background to-background/95 p-6">
        <p className="text-sm text-muted-foreground">Select a workspace</p>
      </aside>
    );
  }

  const workspaceDocuments = documents.filter(
    (d) => d.workspaceId === currentWorkspaceId
  );

  const filteredDocs = workspaceDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-72 border-r border-border/40 bg-gradient-to-b from-background to-background/95 overflow-y-auto max-h-[calc(100vh-60px)] flex flex-col">
      {/* Header Section */}
      <div className="p-6 border-b border-border/30 space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">Documents</h3>
            <p className="text-xs text-muted-foreground">{workspaceDocuments.length} total</p>
          </div>
          <CreateDocumentDialog workspaceId={currentWorkspaceId} />
        </div>

        {/* Search */}
        {workspaceDocuments.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-muted/50 border-border/30"
            />
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {workspaceDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-3 rounded-lg bg-blue-500/10 mb-3">
              <FileText className="h-6 w-6 text-blue-500/50" />
            </div>
            <p className="text-xs text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create one to get started</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-xs text-muted-foreground">No matches found</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <Link
              key={doc.id}
              href={`/dashboard/${currentWorkspaceId}/documents/${doc.id}`}
              className="group block"
            >
              <div className="p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-sm border border-transparent hover:border-border/30">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer - New Document Button */}
      <div className="p-4 border-t border-border/30 flex-shrink-0">
        <CreateDocumentDialog workspaceId={currentWorkspaceId} />
      </div>
    </aside>
  );
}
