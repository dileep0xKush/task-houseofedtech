import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function initSocket(_userId: string): Socket {
  if (socket) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    // Socket connected
  });

  socket.on("disconnect", () => {
    // Socket disconnected
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinWorkspace(workspaceId: string, userId: string) {
  if (socket) {
    socket.emit("join-workspace", workspaceId, userId);
  }
}

export function joinDocument(documentId: string) {
  if (socket) {
    socket.emit("join-document", documentId);
  }
}

export function emitDocumentChange(documentId: string, operation: any, version: number) {
  if (socket) {
    socket.emit("document-change", {
      documentId,
      operation,
      version,
    });
  }
}

export function emitCursorMove(
  documentId: string,
  position: number,
  selection?: { from: number; to: number }
) {
  if (socket) {
    socket.emit("cursor-move", {
      documentId,
      position,
      selection,
    });
  }
}

export function emitPresenceUpdate(documentId: string, status: string) {
  if (socket) {
    socket.emit("presence-update", {
      documentId,
      status,
    });
  }
}

export function onRemoteChange(callback: (data: any) => void) {
  if (socket) {
    socket.on("remote-change", callback);
  }
}

export function onCursorPosition(callback: (data: any) => void) {
  if (socket) {
    socket.on("cursor-position", callback);
  }
}

export function onPresence(callback: (data: any) => void) {
  if (socket) {
    socket.on("presence", callback);
  }
}

export function onUserJoined(callback: (data: any) => void) {
  if (socket) {
    socket.on("user-joined", callback);
  }
}

export function onUserLeft(callback: (data: any) => void) {
  if (socket) {
    socket.on("user-left", callback);
  }
}
