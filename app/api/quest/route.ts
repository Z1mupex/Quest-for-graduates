import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";
import {
  completeTeamStep,
  createInitialQuestState,
  mutateQuestState,
  readQuestState,
  resolveTimer,
} from "@/lib/server-quest-store";
import type { QuestState, TimerState } from "@/lib/quest-types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  try {
    const state = await readQuestState();
    return NextResponse.json(state);
  } catch (err) {
    console.error("[api/quest GET]", err);
    const message = err instanceof Error ? err.message : "Ошибка хранилища";
    return NextResponse.json(
      {
        error: message,
        hint: "На Vercel подключите Storage → Blob, затем Redeploy.",
      },
      { status: 500 },
    );
  }
}

type PatchBody = {
  action: string;
  teamId?: string;
  step?: number;
};

function pauseTimer(timer: TimerState): TimerState {
  if (timer.status !== "running" || timer.startedAt == null) {
    return { ...timer, status: "paused", startedAt: undefined };
  }
  const elapsed = Date.now() - timer.startedAt;
  return {
    ...timer,
    remainingMs: Math.max(0, timer.remainingMs - elapsed),
    status: "paused",
    startedAt: undefined,
  };
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const isAdmin = session.role === "admin";

  try {
    const state = await mutateQuestState((current) => {
      switch (body.action) {
        case "completeStep": {
          if (session.role !== "team" || body.step == null) return current;
          return completeTeamStep(current, session.userId, body.step);
        }
        case "approvePending": {
          if (!isAdmin || !body.teamId) return current;
          const team = current.teams[body.teamId];
          const step = team?.approvalPendingStep;
          if (!team || step == null) return current;
          return completeTeamStep(current, body.teamId, step);
        }
        case "resetTeam": {
          if (!isAdmin || !body.teamId) return current;
          const initial = createInitialQuestState().teams[body.teamId];
          if (!initial) return current;
          return {
            ...current,
            teams: {
              ...current.teams,
              [body.teamId]: { ...initial },
            },
          };
        }
        case "resetAllTeams": {
          if (!isAdmin) return current;
          return {
            ...current,
            teams: createInitialQuestState().teams,
          };
        }
        case "triggerPenalty": {
          if (!isAdmin || !body.teamId) return current;
          const team = current.teams[body.teamId];
          if (!team) return current;
          return {
            ...current,
            teams: {
              ...current.teams,
              [body.teamId]: { ...team, penaltyActive: true },
            },
          };
        }
        case "clearPenalty": {
          if (!isAdmin || !body.teamId) return current;
          const team = current.teams[body.teamId];
          if (!team) return current;
          return {
            ...current,
            teams: {
              ...current.teams,
              [body.teamId]: { ...team, penaltyActive: false },
            },
          };
        }
        case "startTimer": {
          if (!isAdmin) return current;
          const timer = resolveTimer(current.timer);
          if (timer.status === "finished" || timer.remainingMs <= 0) {
            return {
              ...current,
              timer: { ...timer, remainingMs: 0, status: "finished" },
            };
          }
          return {
            ...current,
            timer: {
              ...timer,
              status: "running",
              startedAt: Date.now(),
            },
          };
        }
        case "pauseTimer": {
          if (!isAdmin) return current;
          return { ...current, timer: pauseTimer(resolveTimer(current.timer)) };
        }
        case "resetTimer": {
          if (!isAdmin) return current;
          const initial = createInitialQuestState().timer;
          return { ...current, timer: initial };
        }
        case "tickTimer": {
          if (!isAdmin) return current;
          const timer = resolveTimer(current.timer);
          if (timer.status !== "running") return current;
          const remainingMs = Math.max(0, timer.remainingMs - 1000);
          if (remainingMs <= 0) {
            return {
              ...current,
              timer: {
                ...timer,
                remainingMs: 0,
                status: "finished",
                startedAt: undefined,
              },
            };
          }
          return {
            ...current,
            timer: {
              ...timer,
              remainingMs,
              startedAt: Date.now(),
            },
          };
        }
        default:
          return current;
      }
    });

    if (body.action === "approvePending" && body.teamId) {
      const { deleteSubmission } = await import("@/lib/server-quest-store");
      await deleteSubmission(body.teamId);
    }
    if (body.action === "resetTeam" && body.teamId) {
      const { deleteSubmission } = await import("@/lib/server-quest-store");
      await deleteSubmission(body.teamId);
    }
    if (body.action === "resetAllTeams") {
      const { deleteSubmission } = await import("@/lib/server-quest-store");
      const { USERS } = await import("@/lib/data");
      await Promise.all(
        USERS.filter((u) => u.role === "team").map((u) =>
          deleteSubmission(u.id),
        ),
      );
    }

    return NextResponse.json(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
