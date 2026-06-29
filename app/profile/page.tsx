"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const initials = (session.user?.name || session.user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={session.user?.image || ""} alt="Profile" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{session.user?.name || "User"}</h2>
                <p className="text-muted-foreground">{session.user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg">{session.user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-lg">{session.user?.name || "Not set"}</p>
              </div>
            </div>

            <div className="pt-6 border-t">
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="text-sm font-mono text-muted-foreground break-all">{(session.user as any)?.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
