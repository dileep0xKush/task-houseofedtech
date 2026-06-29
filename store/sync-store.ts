import { create } from "zustand";
import { PendingOperation, SyncStatus } from "@/types";

interface SyncState {
  status: SyncStatus;
  pendingOperations: Map<string, PendingOperation>;
  lastSyncTime: number;

  addPendingOperation: (op: PendingOperation) => void;
  removePendingOperation: (operationId: string) => void;
  clearPendingOperations: () => void;
  setSyncStatus: (status: SyncStatus["state"]) => void;
  setPendingCount: (count: number) => void;
  setSyncError: (error?: string) => void;
  updateLastSyncTime: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: {
    state: "online",
    pendingCount: 0,
  },
  pendingOperations: new Map(),
  lastSyncTime: 0,

  addPendingOperation: (op) =>
    set((state) => {
      const newMap = new Map(state.pendingOperations);
      newMap.set(op.operationId, op);
      return {
        pendingOperations: newMap,
        status: {
          ...state.status,
          pendingCount: newMap.size,
        },
      };
    }),

  removePendingOperation: (operationId) =>
    set((state) => {
      const newMap = new Map(state.pendingOperations);
      newMap.delete(operationId);
      return {
        pendingOperations: newMap,
        status: {
          ...state.status,
          pendingCount: newMap.size,
        },
      };
    }),

  clearPendingOperations: () =>
    set((state) => ({
      pendingOperations: new Map(),
      status: {
        ...state.status,
        pendingCount: 0,
      },
    })),

  setSyncStatus: (state: SyncStatus["state"]) =>
    set((current) => ({
      status: {
        ...current.status,
        state,
      },
    })),

  setPendingCount: (count) =>
    set((state) => ({
      status: {
        ...state.status,
        pendingCount: count,
      },
    })),

  setSyncError: (error) =>
    set((state) => ({
      status: {
        ...state.status,
        error,
      },
    })),

  updateLastSyncTime: () =>
    set({
      lastSyncTime: Date.now(),
    }),
}));
