import { Operation } from "@/types";

export function createOperationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateClientId(): string {
  if (typeof window === "undefined") return "server";
  return `client-${Math.random().toString(36).substr(2, 9)}`;
}

// Deterministic merge algorithm
// Priority: Version > Timestamp > ClientId
export function mergeOperations(
  remote: Operation[],
  local: Operation[]
): Operation[] {
  const all = [...remote, ...local];

  // Sort by version, then timestamp, then clientId for deterministic ordering
  return all.sort((a, b) => {
    if (a.version !== b.version) {
      return a.version - b.version;
    }
    if (a.timestamp !== b.timestamp) {
      return a.timestamp.getTime() - b.timestamp.getTime();
    }
    return a.clientId.localeCompare(b.clientId);
  });
}

export function applyOperation(
  content: Record<string, any>,
  operation: Operation
): Record<string, any> {
  const copy = JSON.parse(JSON.stringify(content));

  switch (operation.operationType) {
    case "insert": {
      const { position, content: text } = operation.payload;
      if (position !== undefined && text) {
        // Insert operation on content
        // For TipTap JSON content, we'd need to traverse the structure
        // This is simplified - production would use more sophisticated merging
        return applyInsert(copy, position as number, text as string);
      }
      break;
    }
    case "delete": {
      const { position } = operation.payload;
      if (position !== undefined) {
        return applyDelete(copy, position as number);
      }
      break;
    }
    case "update": {
      const { position, content: text } = operation.payload;
      if (position !== undefined && text) {
        return applyUpdate(copy, position as number, text as string);
      }
      break;
    }
    case "merge": {
      // Merge is a no-op as it's handled by the merge algorithm itself
      return copy;
    }
  }

  return copy;
}

function applyInsert(
  content: Record<string, any>,
  position: number,
  text: string
): Record<string, any> {
  // Simplified insertion - production would handle TipTap structure
  if (content.type === "doc" && Array.isArray(content.content)) {
    const copy = { ...content };
    const contentArray = [...content.content];
    contentArray.splice(position, 0, { type: "text", text });
    return { ...copy, content: contentArray };
  }
  return content;
}

function applyDelete(
  content: Record<string, any>,
  position: number
): Record<string, any> {
  if (content.type === "doc" && Array.isArray(content.content)) {
    const copy = { ...content };
    const contentArray = [...content.content];
    contentArray.splice(position, 1);
    return { ...copy, content: contentArray };
  }
  return content;
}

function applyUpdate(
  content: Record<string, any>,
  position: number,
  text: string
): Record<string, any> {
  if (content.type === "doc" && Array.isArray(content.content)) {
    const copy = { ...content };
    const contentArray = [...content.content];
    if (contentArray[position]) {
      contentArray[position] = { ...contentArray[position], text };
    }
    return { ...copy, content: contentArray };
  }
  return content;
}

export function getOperationVersion(operations: Operation[]): number {
  if (operations.length === 0) return 0;
  return Math.max(...operations.map((op) => op.version));
}

export function detectConflict(
  op1: Operation,
  op2: Operation
): boolean {
  // Conflict if operations overlap in document position/range
  // Simplified check - production would be more sophisticated
  const { position: pos1 } = op1.payload;
  const { position: pos2 } = op2.payload;

  if (
    pos1 !== undefined &&
    pos2 !== undefined &&
    op1.operationType !== "merge" &&
    op2.operationType !== "merge"
  ) {
    // Simple overlap detection
    return Math.abs((pos1 as number) - (pos2 as number)) < 10;
  }

  return false;
}

export function createPatchFromOperations(
  operations: Operation[]
): Record<string, any> {
  return {
    operations,
    appliedAt: new Date().toISOString(),
    count: operations.length,
  };
}

export function isValidOperation(op: any): boolean {
  return (
    op.operationId &&
    op.clientId &&
    op.documentId &&
    typeof op.version === "number" &&
    op.timestamp &&
    ["insert", "delete", "update", "merge"].includes(op.operationType) &&
    op.payload &&
    typeof op.payload === "object"
  );
}
