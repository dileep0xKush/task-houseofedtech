"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

interface CKEditorWrapperProps {
  initialContent?: string;
  onSave: (content: string) => void;
  disabled?: boolean;
}

export function CKEditorWrapper({
  initialContent = "",
  onSave,
  disabled = false,
}: CKEditorWrapperProps) {
  const editorRef = useRef<any>(null);
  const { setSelectedText } = useEditorStore();

  const handleChange = useCallback(
    (_event: any, editor: any) => {
      const data = editor.getData();
      onSave(data);
    },
    [onSave]
  );

  const handleSelectionChange = useCallback(() => {
    if (editorRef.current) {
      try {
        const editor = editorRef.current;

        // Get selected text using CKEditor's text extraction
        const selection = editor.model.document.selection;
        let selectedText = "";

        // Method 1: Try to extract from selection ranges
        const selectionHasContent = selection.getFirstRange()?.getWalker();
        if (selectionHasContent) {
          for (const range of selection.getRanges()) {
            // Convert range to text
            for (const item of range.getItems()) {
              if (item.is("$text")) {
                selectedText += item.data;
              }
            }
          }
        }

        // Method 2: If no selection, get from editor content
        if (!selectedText || selectedText.length === 0) {
          // Use native browser selection as fallback
          const nativeSelection = window.getSelection();
          if (nativeSelection && nativeSelection.toString()) {
            selectedText = nativeSelection.toString();
          }
        }

        if (selectedText && selectedText.trim().length > 0) {
          setSelectedText(selectedText.trim());
        }
      } catch (error) {
        console.error("Error getting selected text:", error);
      }
    }
  }, [setSelectedText]);

  useEffect(() => {
    const handleMouseUp = () => {
      handleSelectionChange();
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleSelectionChange]);

  const getCleanContent = (content: any) => {
    if (!content) return "";
    if (typeof content === "string") {
      return content;
    }
    return "";
  };

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <CKEditor
        editor={ClassicEditor as any}
        data={getCleanContent(initialContent)}
        onChange={handleChange}
        onReady={(editor: any) => {
          editorRef.current = editor;
          // Listen to model changes to track selection
          editor.model.document.on("change:data", handleSelectionChange);
        }}
        disabled={disabled}
        config={{
          toolbar: {
            items: [
              "heading",
              "|",
              "bold",
              "italic",
              "underline",
              "strikethrough",
              "subscript",
              "superscript",
              "|",
              "fontSize",
              "fontFamily",
              "fontColor",
              "fontBackgroundColor",
              "|",
              "alignment",
              "|",
              "bulletedList",
              "numberedList",
              "outdent",
              "indent",
              "|",
              "link",
              "blockQuote",
              "insertTable",
              "codeBlock",
              "mediaEmbed",
              "|",
              "undo",
              "redo",
            ],
            shouldNotGroupWhenFull: true,
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
          codeBlock: {
            languages: [
              { language: "js", label: "JavaScript" },
              { language: "python", label: "Python" },
              { language: "sql", label: "SQL" },
              { language: "html", label: "HTML" },
              { language: "css", label: "CSS" },
            ],
          },
        }}
      />
      <style>{`
        .ck.ck-editor__main > .ck-editor__editable {
          min-height: 600px !important;
          max-height: 800px !important;
          overflow-y: auto !important;
        }
        .ck.ck-editor__top .ck-toolbar {
          flex-wrap: wrap;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}
