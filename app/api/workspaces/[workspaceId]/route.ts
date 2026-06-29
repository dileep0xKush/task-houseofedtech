import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { updateWorkspaceSchema } from "@/lib/validations";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canDeleteWorkspace } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
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

    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: true,
        members: { include: { user: true } },
        folders: true,
        documents: true,
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    return NextResponse.json({ data: workspace });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
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

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    // Check if user is owner
    if (workspace.ownerId !== user.id) {
      throw new ForbiddenError("Only owner can update workspace");
    }

    const body = await _request.json();
    const validated = updateWorkspaceSchema.parse(body);

    const updated = await db.workspace.update({
      where: { id: workspaceId },
      data: {
        name: validated.name || workspace.name,
      },
      include: {
        owner: true,
        members: { include: { user: true } },
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
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
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

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    // Check if user is owner and can delete
    if (workspace.ownerId !== user.id || !canDeleteWorkspace("OWNER")) {
      throw new ForbiddenError("Only owner can delete workspace");
    }

    await db.workspace.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
