import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  getErrorResponse,
} from "@/lib/errors";

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
        members: {
          include: { user: { select: { id: true, email: true, name: true, image: true } } },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    return NextResponse.json({ data: workspace.members });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function POST(
  request: NextRequest,
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

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenError("Only workspace owner can add members");
    }

    const { email, role } = await request.json();

    const memberUser = await db.user.findUnique({
      where: { email },
    });

    if (!memberUser) {
      throw new NotFoundError("User", email);
    }

    const member = await db.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: memberUser.id,
        },
      },
      update: { role: role || "EDITOR" },
      create: {
        workspaceId,
        userId: memberUser.id,
        role: role || "EDITOR",
      },
      include: { user: true },
    });

    return NextResponse.json({ data: member });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
