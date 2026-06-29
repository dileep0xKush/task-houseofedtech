import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { updateFolderSchema } from "@/lib/validations";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
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

    const folder = await db.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundError("Folder", folderId);
    }

    // Check workspace access
    const workspace = await db.workspace.findFirst({
      where: {
        id: folder.workspaceId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    });

    if (!workspace) {
      throw new ForbiddenError("No access to this workspace");
    }

    const body = await request.json();
    const validated = updateFolderSchema.parse(body);

    const updated = await db.folder.update({
      where: { id: folderId },
      data: {
        name: validated.name || folder.name,
        parentId: validated.parentId !== undefined ? validated.parentId : folder.parentId,
        order: validated.order !== undefined ? validated.order : folder.order,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
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

    const folder = await db.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundError("Folder", folderId);
    }

    // Check workspace access
    const workspace = await db.workspace.findUnique({
      where: { id: folder.workspaceId },
    });

    if (workspace?.ownerId !== user.id) {
      throw new ForbiddenError("Only workspace owner can delete folders");
    }

    await db.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
