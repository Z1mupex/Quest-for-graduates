import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";
import {
  completeTeamStep,
  createInitialQuestState,
  didCompleteStep,
  mutateQuestState,
  mutateQuestTimer,
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
    const before =
      body.action === "completeStep" ? await readQuestState() : null;

    if (
      body.action === "startTimer" ||
      body.action === "pauseTimer" ||
      body.action === "resetTimer" ||
      body.action === "tickTimer"
    ) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
      }

      const state = await mutateQuestTimer((timer) => {
        switch (body.action) {
          case "startTimer": {
            const resolved = resolveTimer(timer);
            if (resolved.status === "finished" || resolved.remainingMs <= 0) {
              return { ...resolved, remainingMs: 0, status: "finished" };
            }
            return {
              ...resolved,
              status: "running",
              startedAt: Date.now(),
            };
          }
          case "pauseTimer":
            return pauseTimer(resolveTimer(timer));
          case "resetTimer":
            return createInitialQuestState().timer;
          case "tickTimer": {
            const resolved = resolveTimer(timer);
            if (resolved.status !== "running") return resolved;
            const remainingMs = Math.max(0, resolved.remainingMs - 1000);
            if (remainingMs <= 0) {
              return {
                ...resolved,
                remainingMs: 0,
                status: "finished",
                startedAt: undefined,
              };
            }
            return {
              ...resolved,
              remainingMs,
              startedAt: Date.now(),
            };
          }
          default:
            return timer;
        }
      });

      return NextResponse.json(state);
    }

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
        default:
          return current;
      }
    });

    if (
      body.action === "completeStep" &&
      body.step != null &&
      session.role === "team" &&
      before &&
      !didCompleteStep(before, state, session.userId, body.step)
    ) {
      return NextResponse.json(
        {
          error:
            "Не удалось засчитать шаг. Обновите страницу и попробуйте снова.",
        },
        { status: 409 },
      );
    }

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
