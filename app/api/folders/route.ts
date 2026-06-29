import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createFolderSchema } from "@/lib/validations";
import {
  UnauthorizedError,
  ForbiddenError,
  getErrorResponse,
} from "@/lib/errors";

export async function POST(_request: NextRequest) {
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

    const body = await _request.json();
    const validated = createFolderSchema.parse(body);

    // Check if user has access to workspace
    const workspace = await db.workspace.findFirst({
      where: {
        id: validated.workspaceId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    });

    if (!workspace) {
      throw new ForbiddenError("No access to this workspace");
    }

    const folder = await db.folder.create({
      data: {
        name: validated.name,
        workspaceId: validated.workspaceId,
        parentId: validated.parentId,
        order: 0,
      },
    });

    return NextResponse.json({ data: folder });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function GET(_request: NextRequest) {
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

    const url = new URL(_request.url);
    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId) {
      throw new Error("workspaceId required");
    }

    // Check access
    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    });

    if (!workspace) {
      throw new ForbiddenError("No access to this workspace");
    }

    const folders = await db.folder.findMany({
      where: { workspaceId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ data: folders });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
