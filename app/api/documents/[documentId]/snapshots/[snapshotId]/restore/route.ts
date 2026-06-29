import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canEditDocument } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string; snapshotId: string }> }
) {
  try {
    const { documentId, snapshotId } = await params;
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
      throw new NotFoundError("Document", documentId);
    }

    // Check if user can edit
    const memberRole = await db.workspaceMember.findFirst({
      where: {
        workspaceId: document.workspaceId,
        userId: user.id,
      },
    });

    if (!memberRole || !canEditDocument(memberRole.role)) {
      throw new ForbiddenError("Cannot edit this document");
    }

    const snapshot = await db.documentSnapshot.findFirst({
      where: {
        id: snapshotId,
        documentId: documentId,
      },
    });

    if (!snapshot) {
      throw new NotFoundError("Snapshot", snapshotId);
    }

    // Restore creates a new snapshot (immutable history)
    await db.document.update({
      where: { id: documentId },
      data: {
        content: snapshot.content as any,
        title: snapshot.title,
        version: document.version + 1,
      },
    });

    // Create a new snapshot for the restore action
    const restoreSnapshot = await db.documentSnapshot.create({
      data: {
        documentId: documentId,
        content: snapshot.content as any,
        version: document.version + 1,
        title: snapshot.title,
        userId: user.id,
        message: `Restored from version ${snapshot.version}`,
      },
    });

    return NextResponse.json({ data: restoreSnapshot });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
