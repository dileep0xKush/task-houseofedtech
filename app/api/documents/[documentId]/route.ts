import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { updateDocumentSchema } from "@/lib/validations";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canEditDocument } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
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
        OR: [
          {
            workspace: {
              OR: [
                { ownerId: user.id },
                { members: { some: { userId: user.id } } },
              ],
            },
          },
          {
            members: { some: { userId: user.id } },
          },
        ],
      },
      include: {
        members: { include: { user: true } },
      },
    });

    if (!document) {
      throw new NotFoundError("Document", documentId);
    }

    return NextResponse.json({ data: document });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
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
        OR: [
          {
            workspace: {
              OR: [
                { ownerId: user.id },
                { members: { some: { userId: user.id } } },
              ],
            },
          },
          {
            members: { some: { userId: user.id } },
          },
        ],
      },
    });

    if (!document) {
      throw new NotFoundError("Document", documentId);
    }

    // Check if user can edit (workspace member OR document member with EDITOR role)
    const workspaceMemberRole = await db.workspaceMember.findFirst({
      where: {
        workspaceId: document.workspaceId,
        userId: user.id,
      },
    });

    const documentMemberRole = await db.documentMember.findFirst({
      where: {
        documentId,
        userId: user.id,
      },
    });

    console.log(`[PATCH Document] User: ${user.email}, Workspace Role: ${workspaceMemberRole?.role}, Doc Role: ${documentMemberRole?.role}`);

    const canEdit =
      (workspaceMemberRole && canEditDocument(workspaceMemberRole.role)) ||
      (documentMemberRole && documentMemberRole.role === 'EDITOR');

    if (!canEdit) {
      throw new ForbiddenError("Cannot edit this document");
    }

    const body = await request.json();
    const validated = updateDocumentSchema.parse(body);

    const newContent = validated.content || (document.content as any);
    const newTitle = validated.title || document.title;

    const updated = await db.document.update({
      where: { id: documentId },
      data: {
        title: newTitle,
        content: newContent,
        version: document.version + 1,
        folderId: validated.folderId !== undefined ? validated.folderId : document.folderId,
      },
      include: {
        members: { include: { user: true } },
      },
    });

    // Create snapshot if content was updated
    if (validated.content) {
      try {
        await db.documentSnapshot.create({
          data: {
            documentId,
            content: newContent as any,
            version: updated.version,
            title: newTitle,
            userId: user.id,
            message: `Updated via editor - Version ${updated.version}`,
          },
        });
      } catch (error) {
        console.error("Failed to create snapshot:", error);
        // Don't fail the update if snapshot creation fails
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
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

    // Check if user is workspace owner
    const workspace = await db.workspace.findUnique({
      where: { id: document.workspaceId },
    });

    if (workspace?.ownerId !== user.id) {
      throw new ForbiddenError("Only workspace owner can delete documents");
    }

    await db.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
