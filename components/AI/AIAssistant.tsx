"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Zap,
  MessageCircle,
  Copy,
  Check,
  Loader2,
  X,
  Plus,
} from "lucide-react";

interface AIAssistantProps {
  documentId: string;
  onApplyResult?: (result: string) => void;
}

type AIAction =
  | "summarize"
  | "improve"
  | "grammar"
  | "continue"
  | "rewrite"
  | "explain"
  | "notes"
  | "actions";

export function AIAssistant({ documentId, onApplyResult }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const editorStore = useEditorStore();

  const selectedText =
    editorStore.selectedText || "No text selected. Select text to use AI features.";

  const handleAIAction = async (action: AIAction) => {
    if (!selectedText || selectedText === "No text selected. Select text to use AI features.") {
      setResult("Please select some text first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          action,
          selectedText,
        }),
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      const data = await response.json();
      setResult(data.data.result);
    } catch (error) {
      setResult("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyResult = () => {
    if (onApplyResult) {
      onApplyResult(result);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen ? (
        <Card className="w-96 max-h-[600px] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick Actions:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAIAction("summarize")}
                  disabled={isLoading}
                >
                  Summarize
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAIAction("improve")}
                  disabled={isLoading}
                >
                  Improve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAIAction("grammar")}
                  disabled={isLoading}
                >
                  Grammar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAIAction("continue")}
                  disabled={isLoading}
                >
                  Continue
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAIAction("rewrite")}
                  disabled={isLoading}
                >
                  Rewrite
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAIAction("explain")}
                  disabled={isLoading}
                >
                  Explain
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAIAction("notes")}
                  disabled={isLoading}
                >
                  Notes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAIAction("actions")}
                  disabled={isLoading}
                >
                  Actions
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}

            {result && !isLoading && (
              <div className="space-y-2">
                <div className="rounded-md bg-muted p-3 text-sm">
                  {result}
                </div>
                <div className="flex gap-2">
                  {onApplyResult && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={applyResult}
                      className="flex-1"
                    >
                      {applied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Apply
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
