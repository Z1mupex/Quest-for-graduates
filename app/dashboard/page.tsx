import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session || session.role !== "team") {
    redirect("/login");
  }

  return <DashboardClient teamId={session.userId} />;
}
