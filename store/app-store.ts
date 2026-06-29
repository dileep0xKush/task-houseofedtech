import { create } from "zustand";
import { Workspace, Document, Folder, Collaborator } from "@/types";

interface AppState {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  documents: Document[];
  folders: Folder[];
  collaborators: Collaborator[];
  isLoading: boolean;
  searchQuery: string;

  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspaceId: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;

  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (document: Document) => void;
  removeDocument: (documentId: string) => void;

  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (folder: Folder) => void;
  removeFolder: (folderId: string) => void;

  setCollaborators: (collaborators: Collaborator[]) => void;
  updateCollaborator: (collaborator: Collaborator) => void;

  setIsLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;

  getCurrentWorkspace: () => Workspace | undefined;
  getDocument: (documentId: string) => Document | undefined;
  getFolder: (folderId: string) => Folder | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  workspaces: [],
  documents: [],
  folders: [],
  collaborators: [],
  isLoading: false,
  searchQuery: "",

  setWorkspaces: (workspaces) => set({ workspaces }),

  setCurrentWorkspace: (workspaceId) => set({ currentWorkspaceId: workspaceId }),

  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    })),

  updateWorkspace: (workspace) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspace.id ? workspace : w
      ),
    })),

  removeWorkspace: (workspaceId) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
      currentWorkspaceId:
        state.currentWorkspaceId === workspaceId
          ? undefined
          : state.currentWorkspaceId,
    })),

  setDocuments: (documents) => set({ documents }),

  addDocument: (document) =>
    set((state) => ({
      documents: [...state.documents, document],
    })),

  updateDocument: (document) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === document.id ? document : d
      ),
    })),

  removeDocument: (documentId) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== documentId),
    })),

  setFolders: (folders) => set({ folders }),

  addFolder: (folder) =>
    set((state) => ({
      folders: [...state.folders, folder],
    })),

  updateFolder: (folder) =>
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === folder.id ? folder : f
      ),
    })),

  removeFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== folderId),
    })),

  setCollaborators: (collaborators) => set({ collaborators }),

  updateCollaborator: (collaborator) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.userId === collaborator.userId ? collaborator : c
      ),
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  getCurrentWorkspace: () => {
    const state = get();
    return state.workspaces.find((w) => w.id === state.currentWorkspaceId);
  },

  getDocument: (documentId) => {
    const state = get();
    return state.documents.find((d) => d.id === documentId);
  },

  getFolder: (folderId) => {
    const state = get();
    return state.folders.find((f) => f.id === folderId);
  },
}));
