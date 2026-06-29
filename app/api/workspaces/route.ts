import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createWorkspaceSchema } from "@/lib/validations";
import {
  UnauthorizedError,
  getErrorResponse,
} from "@/lib/errors";

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

    const workspaces = await db.workspace.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: true,
        members: {
          include: { user: true },
        },
        _count: {
          select: { documents: true, folders: true },
        },
      },
    });

    return NextResponse.json({ data: workspaces });
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
    const validated = createWorkspaceSchema.parse(body);

    const workspace = await db.workspace.create({
      data: {
        name: validated.name,
        ownerId: user.id,
      },
      include: {
        owner: true,
        members: { include: { user: true } },
      },
    });

    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
