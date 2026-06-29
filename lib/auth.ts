import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }
  return session.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function canManageWorkspace(role: Role): boolean {
  return role === "OWNER";
}

export function canEditDocument(role: Role): boolean {
  return role === "OWNER" || role === "EDITOR";
}

export function canViewDocument(role: Role): boolean {
  return role === "OWNER" || role === "EDITOR" || role === "VIEWER";
}

export function canDeleteWorkspace(role: Role): boolean {
  return role === "OWNER";
}

export function canInviteMembers(role: Role): boolean {
  return role === "OWNER";
}

export function canSync(role: Role): boolean {
  return role !== "VIEWER";
}
