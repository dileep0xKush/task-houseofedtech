import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createSnapshotSchema } from "@/lib/validations";
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

    const snapshots = await db.documentSnapshot.findMany({
      where: { documentId: documentId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: snapshots });
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

    const body = await request.json();
    const validated = createSnapshotSchema.parse(body);

    const snapshot = await db.documentSnapshot.create({
      data: {
        documentId: documentId,
        content: document.content as any,
        version: document.version,
        title: document.title,
        userId: user.id,
        message: validated.message,
      },
      include: { user: true },
    });

    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
