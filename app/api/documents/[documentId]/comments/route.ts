import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { UnauthorizedError, getErrorResponse } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
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

    // Check document access
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { workspace: { ownerId: user.id } },
          { members: { some: { userId: user.id } } },
        ],
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const comments = await db.comment.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: comments,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new UnauthorizedError();
    }

    // Rate limiting: 30 comments per minute
    const identifier = `${session.user.email}:comments`;
    if (!rateLimit(identifier, 30, 60000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new UnauthorizedError();
    }
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    // Check document access and that user is at least EDITOR
    const documentMember = await db.documentMember.findFirst({
      where: {
        documentId,
        userId: user.id,
        role: { in: ["EDITOR", "OWNER"] },
      },
    });

    // If not a document member, check if they're the workspace owner
    if (!documentMember) {
      const document = await db.document.findFirst({
        where: {
          id: documentId,
          workspace: { ownerId: user.id },
        },
      });

      if (!document) {
        return NextResponse.json(
          { error: "You do not have permission to comment on this document" },
          { status: 403 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        content: validated.content,
        documentId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
