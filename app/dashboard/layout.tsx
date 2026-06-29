
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { TopNav } from "@/components/Layout/TopNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="overflow-auto">{children}</main>
    </div>
  );
}
