"use client";

import { useParams } from "next/navigation";
import { useDocument } from "@/hooks/useDocument";
import { useEditorStore } from "@/store/editor-store";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { AIAssistant } from "@/components/AI/AIAssistant";
import { VersionTimeline } from "@/components/VersionHistory/VersionTimeline";
import { ShareDialog } from "@/components/Layout/ShareDialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/Input";

const CKEditorWrapper = dynamic(() => import("@/components/Editor/CKEditorWrapper").then(mod => ({ default: mod.CKEditorWrapper })), {
  ssr: false,
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg" />,
});

export default function DocumentPage() {
  const params = useParams();
  const { data: session } = useSession();
  const documentId = params.documentId as string;
  const workspaceId = params.workspaceId as string;
  const { document, isLoading, updateDocument } = useDocument(documentId);
  const selectedText = useEditorStore((state) => state.selectedText);
  const [showHistory, setShowHistory] = useState(false);
  const [title, setTitle] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  // Sync title when document loads
  useEffect(() => {
    if (document?.title) {
      setTitle(document.title);
    }
  }, [document?.title]);

  // Check if current user is the owner (not in document members = workspace member/owner)
  useEffect(() => {
    if (document?.members && session?.user?.email) {
      const userEmail = session.user.email;
      const isSharedMember = document.members.some(
        (m: any) => m.user.email === userEmail
      );
      // If user is NOT in document members, they're the owner/workspace member
      setIsOwner(!isSharedMember);
    }
  }, [document?.members, session?.user?.email]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== document.title) {
                updateDocument({ title });
              }
            }}
            className="text-3xl font-bold h-auto p-0 border-0 bg-transparent"
            placeholder="Untitled"
          />
          <div className="flex gap-2">
            {isOwner && (
              <>
                <ShareDialog
                  documentId={documentId}
                  workspaceId={workspaceId}
                  documentTitle={document.title}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  History
                </Button>
              </>
            )}
          </div>
        </div>

        {showHistory ? (
          <VersionTimeline
            documentId={documentId}
            currentVersion={document.version}
            isOwner={isOwner}
            onRestore={(snapshot) => {
              updateDocument({
                content: snapshot.content,
                title: snapshot.title,
              });
              setShowHistory(false);
            }}
          />
        ) : (
          <CKEditorWrapper
            initialContent={typeof document.content === "string" ? document.content : JSON.stringify(document.content || "")}
            onSave={(content) => {
              updateDocument({ content } as any);
            }}
          />
        )}
      </div>

      <AIAssistant
        documentId={documentId}
        onApplyResult={(result) => {
          if (selectedText && selectedText !== "No text selected. Select text to use AI features.") {
            const currentContent = typeof document.content === "string"
              ? document.content
              : JSON.stringify(document.content || "");

            // Replace selected text with AI result in the content
            const updatedContent = currentContent.replace(selectedText, result);
            updateDocument({ content: updatedContent } as any);
          }
        }}
      />
    </div>
  );
}
