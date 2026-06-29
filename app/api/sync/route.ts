import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  getErrorResponse,
} from "@/lib/errors";
import { canEditDocument } from "@/lib/auth";
import { applyOperation } from "@/lib/sync-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new UnauthorizedError();
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    const body = await request.json();
    const { documentId, operations, clientVersion } = body;

    // Validate document access
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        workspace: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      },
      include: { workspace: true },
    });

    if (!document) {
      throw new ForbiddenError("No access to this document");
    }

    // Check user's role in workspace
    const memberRole = await db.workspaceMember.findFirst({
      where: {
        workspaceId: document.workspaceId,
        userId: user.id,
      },
    });

    const role = memberRole?.role || "VIEWER";
    // Only editors and owners can send operations
    if (!canEditDocument(role)) {
      throw new ForbiddenError("Only editors and owners can modify documents");
    }

    // Validate operations
    if (!Array.isArray(operations)) {
      throw new ValidationError("Operations must be an array");
    }

    // Get remote operations since client version
    const remoteOperations = await db.operation.findMany({
      where: {
        documentId,
        version: { gt: clientVersion },
      },
      orderBy: [{ version: "asc" }, { timestamp: "asc" }],
    });

    // Store incoming operations
    for (const op of operations) {
      const existing = await db.operation.findUnique({
        where: { operationId: op.operationId },
      });

      if (!existing) {
        await db.operation.create({
          data: {
            operationId: op.operationId,
            clientId: op.clientId,
            documentId,
            version: op.version,
            timestamp: new Date(op.timestamp),
            operationType: op.operationType,
            payload: op.payload,
            userId: user.id,
          },
        });
      }
    }

    // Apply operations to document content
    let updatedContent = (document.content || {}) as Record<string, any>;
    const allOperations = [...remoteOperations, ...operations];
    allOperations.sort((a, b) => {
      if (a.version !== b.version) return a.version - b.version;
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return a.clientId.localeCompare(b.clientId);
    });

    for (const op of allOperations) {
      updatedContent = applyOperation(updatedContent, op as any);
    }

    // Update document version and content
    const newVersion = document.version + operations.length;
    await db.document.update({
      where: { id: documentId },
      data: {
        content: updatedContent,
        version: newVersion,
      },
    });

    // Create automatic snapshot for every change
    if (operations.length > 0) {
      try {
        await db.documentSnapshot.create({
          data: {
            documentId,
            content: updatedContent as any,
            version: newVersion,
            title: document.title,
            userId: user.id,
            message: `Version ${newVersion}`,
          },
        });
      } catch (error) {
        console.error("Failed to create snapshot:", error);
        // Don't fail the sync if snapshot creation fails
      }
    }

    return NextResponse.json({
      data: {
        documentId,
        version: newVersion,
        remoteOperations,
        clientVersion: newVersion,
      },
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new UnauthorizedError();
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const since = searchParams.get("since") ? parseInt(searchParams.get("since")!) : 0;

    if (!documentId) {
      throw new ValidationError("documentId is required");
    }

    // Validate document access
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        workspace: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      },
    });

    if (!document) {
      throw new ForbiddenError("No access to this document");
    }

    const operations = await db.operation.findMany({
      where: {
        documentId,
        version: { gt: since },
      },
      orderBy: [{ version: "asc" }, { timestamp: "asc" }],
    });

    return NextResponse.json({
      data: {
        documentId,
        version: document.version,
        operations,
      },
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
