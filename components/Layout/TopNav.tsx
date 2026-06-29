"use client";

import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSyncStore } from "@/store/sync-store";
import { Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { ProfileDropdown } from "./ProfileDropdown";

export function TopNav() {
  const { data: session } = useSession();
  const syncStatus = useSyncStore((state) => state.status);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-sm shadow-sm">
      <div className="container max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KnowledgeSync
            </span>
            <p className="text-xs text-muted-foreground -mt-1">Workspace</p>
          </div>
        </Link>

        {/* Center - Status */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted/40 border border-border/30">
            {syncStatus.state === "offline" && (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400">Offline</span>
              </>
            )}
            {syncStatus.state === "syncing" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Syncing...</span>
              </>
            )}
            {syncStatus.state === "online" && (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Online</span>
              </>
            )}
            {syncStatus.pendingCount > 0 && (
              <span className="ml-2 text-xs font-medium bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                {syncStatus.pendingCount} pending
              </span>
            )}
          </div>
        </div>

        {/* Right - User Actions */}
        {session?.user?.email && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium">
                {session.user.name || session.user.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {session.user.email}
              </span>
            </div>

            <ThemeToggle />

            <div className="w-px h-5 bg-border/30" />

            <ProfileDropdown />
          </div>
        )}
      </div>
    </nav>
  );
}
