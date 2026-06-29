import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  UnauthorizedError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";

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
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });

    if (!document) {
      throw new NotFoundError("Document", documentId);
    }

    return NextResponse.json({ data: document.members });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function POST(
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

    const { email, role } = await request.json();

    const memberUser = await db.user.findUnique({
      where: { email },
    });

    if (!memberUser) {
      throw new NotFoundError("User", email);
    }

    const member = await db.documentMember.upsert({
      where: {
        documentId_userId: {
          documentId,
          userId: memberUser.id,
        },
      },
      update: { role: role || "VIEWER" },
      create: {
        documentId,
        userId: memberUser.id,
        role: role || "VIEWER",
      },
      include: { user: true },
    });

    return NextResponse.json({ data: member });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function DELETE(
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

    const { userId } = await request.json();

    await db.documentMember.delete({
      where: {
        documentId_userId: {
          documentId,
          userId,
        },
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
