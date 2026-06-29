import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { UnauthorizedError, getErrorResponse } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  resolved: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new UnauthorizedError();
    }

    // Rate limiting: 20 updates per minute
    const identifier = `${session.user.email}:comment-updates`;
    if (!rateLimit(identifier, 20, 60000)) {
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

    const comment = await db.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Only comment owner or document owner can update
    if (comment.userId !== user.id) {
      const document = await db.document.findFirst({
        where: {
          id: comment.documentId,
          workspace: { ownerId: user.id },
        },
      });

      if (!document) {
        return NextResponse.json(
          { error: "You do not have permission to update this comment" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validated = updateCommentSchema.parse(body);

    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: {
        content: validated.content,
        resolved: validated.resolved,
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

    return NextResponse.json({ data: updatedComment });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new UnauthorizedError();
    }

    // Rate limiting: 20 deletions per minute
    const identifier = `${session.user.email}:comment-deletions`;
    if (!rateLimit(identifier, 20, 60000)) {
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

    const comment = await db.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Only comment owner or document owner can delete
    if (comment.userId !== user.id) {
      const document = await db.document.findFirst({
        where: {
          id: comment.documentId,
          workspace: { ownerId: user.id },
        },
      });

      if (!document) {
        return NextResponse.json(
          { error: "You do not have permission to delete this comment" },
          { status: 403 }
        );
      }
    }

    await db.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ data: { id: commentId } });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
