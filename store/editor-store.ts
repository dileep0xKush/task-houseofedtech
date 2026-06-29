import { create } from "zustand";
import { EditorState } from "@/types";

interface EditorStore {
  documents: Map<string, EditorState>;
  activeDocumentId?: string;
  isEditing: boolean;
  selectedText?: string;

  setActiveDocument: (documentId: string, initialContent: any) => void;
  updateDocumentContent: (documentId: string, content: any) => void;
  setIsDirty: (documentId: string, isDirty: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  setSelectedText: (text?: string) => void;
  clearDocument: (documentId: string) => void;
  getDocumentState: (documentId: string) => EditorState | undefined;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  documents: new Map(),
  isEditing: false,

  setActiveDocument: (documentId, initialContent) =>
    set((state) => {
      const newMap = new Map(state.documents);
      newMap.set(documentId, {
        content: initialContent,
        version: 1,
        isDirty: false,
      });
      return {
        documents: newMap,
        activeDocumentId: documentId,
      };
    }),

  updateDocumentContent: (documentId, content) =>
    set((state) => {
      const newMap = new Map(state.documents);
      const existing = newMap.get(documentId) || {
        content: {},
        version: 1,
        isDirty: false,
      };
      newMap.set(documentId, {
        ...existing,
        content,
        isDirty: true,
      });
      return { documents: newMap };
    }),

  setIsDirty: (documentId, isDirty) =>
    set((state) => {
      const newMap = new Map(state.documents);
      const existing = newMap.get(documentId);
      if (existing) {
        newMap.set(documentId, { ...existing, isDirty });
      }
      return { documents: newMap };
    }),

  setIsEditing: (isEditing) => set({ isEditing }),

  setSelectedText: (text) => set({ selectedText: text }),

  clearDocument: (documentId) =>
    set((state) => {
      const newMap = new Map(state.documents);
      newMap.delete(documentId);
      return {
        documents: newMap,
        activeDocumentId:
          state.activeDocumentId === documentId ? undefined : state.activeDocumentId,
      };
    }),

  getDocumentState: (documentId) => {
    const state = get();
    return state.documents.get(documentId);
  },
}));
