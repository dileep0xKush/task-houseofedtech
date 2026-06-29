import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { UnauthorizedError, getErrorResponse } from "@/lib/errors";

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
    const query = searchParams.get("q") || "";
    const workspaceId = searchParams.get("workspaceId") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query || !workspaceId) {
      return NextResponse.json({
        data: { results: [], total: 0 },
      });
    }

    // Search in document titles and content
    const results = await db.document.findMany({
      where: {
        workspaceId,
        workspace: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
        title: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        title: true,
        content: true,
        workspaceId: true,
        createdAt: true,
      },
      take: limit,
      skip: offset,
    });

    const total = await db.document.count({
      where: {
        workspaceId,
        workspace: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
        title: { contains: query, mode: "insensitive" },
      },
    });

    // Score results (simple scoring based on title match)
    const scoredResults = results.map((doc) => {
      let score = 0;
      if (doc.title.toLowerCase().includes(query.toLowerCase())) {
        score += 10;
      }
      const contentStr = JSON.stringify(doc.content);
      if (contentStr.toLowerCase().includes(query.toLowerCase())) {
        score += 5;
      }
      return {
        ...doc,
        score,
      };
    });

    // Sort by score descending
    scoredResults.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      data: {
        results: scoredResults,
        total,
        query,
      },
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
