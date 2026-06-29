"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DocumentSnapshot } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";
import { Clock, RotateCcw, Eye, X, Calendar, User } from "lucide-react";

interface VersionTimelineProps {
  documentId: string;
  onRestore?: (snapshot: DocumentSnapshot) => void;
  currentVersion?: number;
  isOwner?: boolean;
}

export function VersionTimeline({
  documentId,
  onRestore,
  currentVersion = 0,
  isOwner = false,
}: VersionTimelineProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["snapshots", documentId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${documentId}/snapshots`);
      if (!res.ok) throw new Error("Failed to fetch snapshots");
      const data = await res.json();
      return data.data as DocumentSnapshot[];
    },
    refetchInterval: 2000, // Auto-refresh every 2 seconds
  });

  const handleRestore = (snapshot: DocumentSnapshot) => {
    onRestore?.(snapshot);
    queryClient.invalidateQueries({ queryKey: ["snapshots", documentId] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Version History</h3>
            <p className="text-xs text-muted-foreground">{snapshots.length} versions</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading versions...</p>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-12 px-4 bg-muted/30 rounded-lg border border-border/30">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No versions saved yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Snapshots are auto-saved on every change
            </p>
          </div>
        ) : (
          <>
            {snapshots.map((snapshot) => (
              <Card
                key={snapshot.id}
                className={`hover:shadow-md transition-all duration-200 border-border/30 ${
                  snapshot.version === currentVersion
                    ? "border-green-500/50 bg-green-500/5"
                    : "hover:border-blue-500/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          Version {snapshot.version}
                        </span>
                        {snapshot.version === currentVersion && (
                          <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                            Current
                          </span>
                        )}
                        {snapshot.message && (
                          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                            {snapshot.message}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(snapshot.createdAt)}
                        </div>
                        {snapshot.user && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {snapshot.user.name || snapshot.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {snapshot.version !== currentVersion && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Preview"
                            className="hover:border-blue-500/50"
                            onClick={() => {
                              setPreviewId(snapshot.id);
                              const content = snapshot.content;
                              if (typeof content === "string") {
                                setPreviewContent(content);
                              } else {
                                setPreviewContent(JSON.stringify(content, null, 2));
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isOwner && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="Restore to this version"
                              className="hover:border-green-500/50 hover:text-green-600"
                              onClick={() => handleRestore(snapshot)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h3 className="font-semibold">Version Preview</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-muted/30">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {previewContent.includes("<") ? (
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                ) : (
                  <pre className="bg-background p-3 rounded border border-border/30 overflow-x-auto text-xs whitespace-pre-wrap break-words">
                    {previewContent || "No content"}
                  </pre>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
