import { USERS } from "@/lib/data";
import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";
import type { QuestState, TeamState, TimerState } from "@/lib/quest-types";

export const DEFAULT_DURATION_MS = 2.5 * 60 * 60 * 1000;

export function createInitialTeams(): Record<string, TeamState> {
  return Object.fromEntries(
    USERS.filter((u) => u.role === "team").map((u) => [
      u.id,
      {
        currentStep: 1,
        completedSteps: [],
        penaltyActive: false,
      },
    ]),
  );
}

export function createInitialQuestState(): QuestState {
  return {
    teams: createInitialTeams(),
    timer: {
      durationMs: DEFAULT_DURATION_MS,
      remainingMs: DEFAULT_DURATION_MS,
      status: "idle",
    },
  };
}

export function resolveTimer(timer: TimerState): TimerState {
  if (timer.status !== "running" || timer.startedAt == null) {
    return timer;
  }
  const now = Date.now();
  const elapsed = now - timer.startedAt;
  const remainingMs = Math.max(0, timer.remainingMs - elapsed);
  if (remainingMs <= 0) {
    return {
      ...timer,
      remainingMs: 0,
      status: "finished",
      startedAt: undefined,
    };
  }
  return { ...timer, remainingMs, startedAt: now };
}

export function completeTeamStep(
  state: QuestState,
  teamId: string,
  step: number,
): QuestState {
  const team = state.teams[teamId];
  if (!team || step !== team.currentStep || team.completedSteps.includes(step)) {
    return state;
  }
  const completedSteps = [...team.completedSteps, step].sort((a, b) => a - b);
  if (step === TOTAL_QUEST_STEPS) {
    return {
      ...state,
      teams: {
        ...state.teams,
        [teamId]: {
          ...team,
          completedSteps,
          currentStep: TOTAL_QUEST_STEPS + 1,
          finishedAt: Date.now(),
          approvalPendingStep: undefined,
        },
      },
    };
  }
  return {
    ...state,
    teams: {
      ...state.teams,
      [teamId]: {
        ...team,
        completedSteps,
        currentStep: step + 1,
        approvalPendingStep: undefined,
      },
    },
  };
}
