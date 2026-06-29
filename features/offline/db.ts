import Dexie, { Table } from "dexie";
import { Document, PendingOperation } from "@/types";

export interface CachedDocument extends Document {
  localVersion: number;
  lastSyncedAt?: number;
}

export interface CachedWorkspace {
  id: string;
  name: string;
  ownerId: string;
  localVersion: number;
  lastSyncedAt?: number;
}

export class OfflineDB extends Dexie {
  documents!: Table<CachedDocument>;
  workspaces!: Table<CachedWorkspace>;
  pendingOperations!: Table<PendingOperation>;
  snapshots!: Table<any>;

  constructor() {
    super("KnowledgeSync");
    this.version(1).stores({
      documents: "id, workspaceId, updatedAt",
      workspaces: "id, ownerId",
      pendingOperations: "operationId, documentId, status",
      snapshots: "id, documentId, version",
    });
  }
}

export const offlineDb = new OfflineDB();

// Document operations
export async function cacheDocument(doc: CachedDocument): Promise<void> {
  await offlineDb.documents.put({
    ...doc,
    localVersion: doc.version,
    lastSyncedAt: Date.now(),
  });
}

export async function getCachedDocument(
  documentId: string
): Promise<CachedDocument | undefined> {
  return offlineDb.documents.get(documentId);
}

export async function getCachedDocuments(
  workspaceId: string
): Promise<CachedDocument[]> {
  return offlineDb.documents.where("workspaceId").equals(workspaceId).toArray();
}

export async function updateCachedDocument(
  documentId: string,
  updates: Partial<CachedDocument>
): Promise<void> {
  const doc = await offlineDb.documents.get(documentId);
  if (doc) {
    await offlineDb.documents.put({
      ...doc,
      ...updates,
    });
  }
}

export async function deleteCachedDocument(documentId: string): Promise<void> {
  await offlineDb.documents.delete(documentId);
}

// Workspace operations
export async function cacheWorkspace(workspace: CachedWorkspace): Promise<void> {
  await offlineDb.workspaces.put({
    ...workspace,
    lastSyncedAt: Date.now(),
  });
}

export async function getCachedWorkspace(
  workspaceId: string
): Promise<CachedWorkspace | undefined> {
  return offlineDb.workspaces.get(workspaceId);
}

export async function getCachedWorkspaces(): Promise<CachedWorkspace[]> {
  return offlineDb.workspaces.toArray();
}

// Pending operations
export async function addPendingOperation(
  operation: PendingOperation
): Promise<void> {
  await offlineDb.pendingOperations.add(operation);
}

export async function getPendingOperations(
  documentId: string
): Promise<PendingOperation[]> {
  return offlineDb.pendingOperations
    .where("documentId")
    .equals(documentId)
    .toArray();
}

export async function getPendingOperation(
  operationId: string
): Promise<PendingOperation | undefined> {
  return offlineDb.pendingOperations.get(operationId);
}

export async function removePendingOperation(operationId: string): Promise<void> {
  await offlineDb.pendingOperations.delete(operationId);
}

export async function removePendingOperations(
  operationIds: string[]
): Promise<void> {
  await offlineDb.pendingOperations.bulkDelete(operationIds);
}

export async function getAllPendingOperations(): Promise<PendingOperation[]> {
  return offlineDb.pendingOperations.toArray();
}

export async function updatePendingOperationStatus(
  operationId: string,
  status: "pending" | "synced" | "failed"
): Promise<void> {
  const op = await offlineDb.pendingOperations.get(operationId);
  if (op) {
    await offlineDb.pendingOperations.put({
      ...op,
      status,
      retryCount: status === "failed" ? op.retryCount + 1 : op.retryCount,
    });
  }
}

// Snapshots
export async function cacheSnapshot(snapshot: any): Promise<void> {
  await offlineDb.snapshots.add(snapshot);
}

export async function getSnapshots(
  documentId: string
): Promise<any[]> {
  return offlineDb.snapshots
    .where("documentId")
    .equals(documentId)
    .toArray();
}

// Clear all data
export async function clearOfflineDb(): Promise<void> {
  await Promise.all([
    offlineDb.documents.clear(),
    offlineDb.workspaces.clear(),
    offlineDb.pendingOperations.clear(),
    offlineDb.snapshots.clear(),
  ]);
}

// Get storage stats
export async function getOfflineDbStats() {
  const documents = await offlineDb.documents.count();
  const workspaces = await offlineDb.workspaces.count();
  const pendingOps = await offlineDb.pendingOperations.count();
  const snapshots = await offlineDb.snapshots.count();

  return {
    documents,
    workspaces,
    pendingOperations: pendingOps,
    snapshots,
    total: documents + workspaces + pendingOps + snapshots,
  };
}
