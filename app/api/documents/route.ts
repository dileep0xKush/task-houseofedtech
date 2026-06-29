import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createDocumentSchema } from "@/lib/validations";
import {
  UnauthorizedError,
  ForbiddenError,
  getErrorResponse,
} from "@/lib/errors";

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
    const workspaceId = searchParams.get("workspaceId");
    const folderId = searchParams.get("folderId");

    const whereClause: any = {
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
    };

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    }

    if (folderId) {
      whereClause.folderId = folderId;
    }

    const documents = await db.document.findMany({
      where: whereClause,
      include: {
        members: { include: { user: true } },
        _count: { select: { snapshots: true, operations: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: documents });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

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
    const validated = createDocumentSchema.parse(body);

    // Check workspace access
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

    const document = await db.document.create({
      data: {
        title: validated.title,
        workspaceId: validated.workspaceId,
        folderId: validated.folderId,
        content: { type: "doc", content: [] },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
