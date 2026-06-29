import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {

    // Join workspace room
    socket.on("join-workspace", (workspaceId: string, userId: string) => {
      socket.join(`workspace:${workspaceId}`);
      socket.data.workspaceId = workspaceId;
      socket.data.userId = userId;

      io.to(`workspace:${workspaceId}`).emit("user-joined", {
        userId,
        timestamp: Date.now(),
      });
    });

    // Join document room
    socket.on("join-document", (documentId: string) => {
      socket.join(`document:${documentId}`);
      socket.data.documentId = documentId;

      io.to(`document:${documentId}`).emit("user-focused", {
        userId: socket.data.userId,
        timestamp: Date.now(),
      });
    });

    // Handle document changes
    socket.on("document-change", (data: any) => {
      const { documentId, operation, version } = data;

      io.to(`document:${documentId}`).emit("remote-change", {
        operation,
        version,
        userId: socket.data.userId,
        timestamp: Date.now(),
      });
    });

    // Handle cursor updates
    socket.on("cursor-move", (data: any) => {
      const { documentId, position, selection } = data;

      socket.to(`document:${documentId}`).emit("cursor-position", {
        userId: socket.data.userId,
        position,
        selection,
      });
    });

    // Handle presence updates
    socket.on("presence-update", (data: any) => {
      const { documentId, status } = data;

      io.to(`document:${documentId}`).emit("presence", {
        userId: socket.data.userId,
        status,
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      const workspaceId = socket.data.workspaceId;
      const documentId = socket.data.documentId;

      if (workspaceId) {
        io.to(`workspace:${workspaceId}`).emit("user-left", {
          userId: socket.data.userId,
          timestamp: Date.now(),
        });
      }

      if (documentId) {
        io.to(`document:${documentId}`).emit("user-left", {
          userId: socket.data.userId,
        });
      }
    });
  });

  return io;
}
