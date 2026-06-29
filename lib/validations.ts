import { z } from "zod";

// Workspace Schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

// Folder Schemas
export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  workspaceId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().cuid().optional().nullable(),
  order: z.number().int().optional(),
});

// Document Schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  workspaceId: z.string().cuid(),
  folderId: z.string().cuid().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.union([z.string(), z.record(z.any())]).optional(),
  folderId: z.string().cuid().optional().nullable(),
});

// Operation Schemas
export const operationSchema = z.object({
  operationId: z.string().min(10),
  clientId: z.string(),
  documentId: z.string().cuid(),
  version: z.number().int().positive(),
  timestamp: z.number(),
  operationType: z.enum(["insert", "delete", "update", "merge"]),
  payload: z.record(z.any()),
});

export const syncOperationsSchema = z.object({
  operations: z.array(operationSchema),
  clientVersion: z.number().int().nonnegative(),
});

// Snapshot Schemas
export const createSnapshotSchema = z.object({
  documentId: z.string().cuid(),
  message: z.string().max(500).optional(),
});

// Member Schemas
export const inviteMemberSchema = z.object({
  workspaceId: z.string().cuid(),
  email: z.string().email(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

export const updateMemberRoleSchema = z.object({
  workspaceId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

// AI Schemas
export const aiRequestSchema = z.object({
  documentId: z.string().cuid(),
  action: z.enum([
    "summarize",
    "improve",
    "grammar",
    "continue",
    "rewrite",
    "explain",
    "notes",
    "actions",
  ]),
  text: z.string().max(50000).optional(),
  selectedText: z.string().max(10000).optional(),
});

// Search Schemas
export const searchSchema = z.object({
  query: z.string().min(1).max(255),
  workspaceId: z.string().cuid(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type inference
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type Operation = z.infer<typeof operationSchema>;
export type SyncOperations = z.infer<typeof syncOperationsSchema>;
export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type AIRequest = z.infer<typeof aiRequestSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
