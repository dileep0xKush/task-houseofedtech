import { Role } from "@prisma/client";

export type { Role };

// User
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Workspace
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  owner?: User;
  members?: WorkspaceMember[];
  folders?: Folder[];
  documents?: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  user?: User;
  workspace?: Workspace;
  createdAt: Date;
  updatedAt: Date;
}

// Folder
export interface Folder {
  id: string;
  name: string;
  workspaceId: string;
  parentId?: string;
  order: number;
  parent?: Folder;
  children?: Folder[];
  documents?: Document[];
  createdAt: Date;
  updatedAt: Date;
}

// Document
export interface Document {
  id: string;
  title: string;
  content: Record<string, any>;
  workspaceId: string;
  folderId?: string;
  version: number;
  members?: DocumentMember[];
  snapshots?: DocumentSnapshot[];
  operations?: Operation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMember {
  id: string;
  documentId: string;
  userId: string;
  role: Role;
  user?: User;
  document?: Document;
  createdAt: Date;
  updatedAt: Date;
}

// Snapshot
export interface DocumentSnapshot {
  id: string;
  documentId: string;
  content: Record<string, any>;
  version: number;
  title: string;
  userId: string;
  message?: string;
  user?: User;
  document?: Document;
  createdAt: Date;
}

// Sync & Operations
export interface Operation {
  id: string;
  operationId: string;
  clientId: string;
  documentId: string;
  version: number;
  timestamp: Date;
  operationType: OperationType;
  payload: OperationPayload;
  userId: string;
  createdAt: Date;
}

export type OperationType = "insert" | "delete" | "update" | "merge";

export interface OperationPayload {
  type: OperationType;
  position?: number;
  content?: string;
  nodeType?: string;
  marks?: Record<string, any>;
  attrs?: Record<string, any>;
}

export interface PendingOperation {
  operationId: string;
  clientId: string;
  documentId: string;
  version: number;
  timestamp: number;
  operationType: OperationType;
  payload: OperationPayload;
  status: "pending" | "synced" | "failed";
  retryCount: number;
}

// Sync Status
export interface SyncStatus {
  state: "online" | "offline" | "syncing";
  pendingCount: number;
  lastSyncTime?: number;
  error?: string;
}

// Editor State
export interface EditorState {
  content: Record<string, any>;
  version: number;
  isDirty: boolean;
}

// UI Types
export interface CreateWorkspaceInput {
  name: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
}

export interface CreateFolderInput {
  name: string;
  workspaceId: string;
  parentId?: string;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string;
  order?: number;
}

export interface CreateDocumentInput {
  title: string;
  workspaceId: string;
  folderId?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: Record<string, any>;
  folderId?: string;
}

export interface CreateSnapshotInput {
  documentId: string;
  message?: string;
}

export interface InviteMemberInput {
  workspaceId: string;
  email: string;
  role: Role;
}

export interface UpdateMemberRoleInput {
  workspaceId: string;
  userId: string;
  role: Role;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

// Collaboration
export interface Collaborator {
  userId: string;
  name?: string;
  email: string;
  image?: string;
  role: Role;
  online: boolean;
  lastSeen: number;
}

export interface CollaborationState {
  documentId: string;
  collaborators: Collaborator[];
  locks: Record<string, { userId: string; timestamp: number }>;
}

// AI Features
export interface AIRequest {
  documentId: string;
  action: AIAction;
  text?: string;
  selectedText?: string;
}

export type AIAction =
  | "summarize"
  | "improve"
  | "grammar"
  | "continue"
  | "rewrite"
  | "explain"
  | "notes"
  | "actions";

export interface AIResponse {
  result: string;
  tokens: number;
}

// Search
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  documentId: string;
  workspaceId: string;
  score: number;
}

export interface SearchParams {
  query: string;
  workspaceId: string;
  limit?: number;
  offset?: number;
}
