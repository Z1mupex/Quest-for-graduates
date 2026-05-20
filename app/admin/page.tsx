import { redirect } from "next/navigation";
import { AdminQuestHydrate } from "@/components/AdminQuestHydrate";
import { AdminTeamGrid } from "@/components/AdminTeamGrid";
import { TimerControls } from "@/components/TimerControls";
import { getServerSession } from "@/lib/auth";
import { readQuestState } from "@/lib/server-quest-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  let initialState = null;
  try {
    initialState = await readQuestState();
  } catch (err) {
    console.error("[admin] readQuestState", err);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row">
      {initialState ? <AdminQuestHydrate initialState={initialState} /> : null}
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
