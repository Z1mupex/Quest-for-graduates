import { redirect } from "next/navigation";
import { AdminTeamGrid } from "@/components/AdminTeamGrid";
import { TimerControls } from "@/components/TimerControls";
import { getServerSession } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row">
      <div className="lg:w-1/3">
        <TimerControls />
      </div>
      <div className="flex-1 space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Панель администратора</h1>
          <p className="text-sm text-muted-foreground">
            Управление таймером и прогрессом команд.
          </p>
        </div>
        <AdminTeamGrid />
      </div>
    </div>
  );
}
