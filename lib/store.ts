import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { USERS } from "@/lib/data";

export type TeamState = {
  currentStep: number;
  completedSteps: number[];
  penaltyActive: boolean;
  finishedAt?: number;
};

export type TimerState = {
  durationMs: number;
  remainingMs: number;
  status: "idle" | "running" | "paused" | "finished";
  startedAt?: number;
};

const DEFAULT_DURATION_MS = 7_200_000;

const initialTeams: Record<string, TeamState> = Object.fromEntries(
  USERS.filter((u) => u.role === "team").map((u) => [
    u.id,
    {
      currentStep: 0,
      completedSteps: [],
      penaltyActive: false,
    } satisfies TeamState,
  ]),
);

type QuestStore = {
  teams: Record<string, TeamState>;
  timer: TimerState;
  unlockStep: (teamId: string, step: number) => void;
  completeStep: (teamId: string, step: number) => void;
  resetTeam: (teamId: string) => void;
  resetAllTeams: () => void;
  triggerPenalty: (teamId: string) => void;
  clearPenalty: (teamId: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
};

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      teams: initialTeams,
      timer: {
        durationMs: DEFAULT_DURATION_MS,
        remainingMs: DEFAULT_DURATION_MS,
        status: "idle",
      },
      unlockStep: (teamId, step) => {
        set((state) => {
          const team = state.teams[teamId];
          if (!team) return state;
          if (step !== team.currentStep + 1) return state;
          return {
            teams: {
              ...state.teams,
              [teamId]: { ...team, currentStep: step },
            },
          };
        });
      },
      completeStep: (teamId, step) => {
        set((state) => {
          const team = state.teams[teamId];
          if (!team) return state;
          if (step !== team.currentStep) return state;
          if (team.completedSteps.includes(step)) return state;
          const completedSteps = [...team.completedSteps, step].sort(
            (a, b) => a - b,
          );
          if (step === 9) {
            return {
              teams: {
                ...state.teams,
                [teamId]: {
                  ...team,
                  completedSteps,
                  currentStep: 10,
                  finishedAt: Date.now(),
                },
              },
            };
          }
          return {
            teams: {
              ...state.teams,
              [teamId]: { ...team, completedSteps },
            },
          };
        });
      },
      resetTeam: (teamId) => {
        set((state) => ({
          teams: {
            ...state.teams,
            [teamId]: {
              currentStep: 0,
              completedSteps: [],
              penaltyActive: false,
            },
          },
        }));
      },
      resetAllTeams: () => {
        set({ teams: { ...initialTeams } });
      },
      triggerPenalty: (teamId) => {
        set((state) => {
          const team = state.teams[teamId];
          if (!team) return state;
          return {
            teams: {
              ...state.teams,
              [teamId]: { ...team, penaltyActive: true },
            },
          };
        });
      },
      clearPenalty: (teamId) => {
        set((state) => {
          const team = state.teams[teamId];
          if (!team) return state;
          return {
            teams: {
              ...state.teams,
              [teamId]: { ...team, penaltyActive: false },
            },
          };
        });
      },
      startTimer: () => {
        set((state) => {
          if (state.timer.status === "finished") return state;
          if (state.timer.remainingMs <= 0) {
            return {
              timer: {
                ...state.timer,
                remainingMs: 0,
                status: "finished",
              },
            };
          }
          return {
            timer: {
              ...state.timer,
              status: "running",
              startedAt: Date.now(),
            },
          };
        });
      },
      pauseTimer: () => {
        set((state) => {
          if (state.timer.status !== "running") return state;
          return {
            timer: {
              ...state.timer,
              status: "paused",
              startedAt: undefined,
            },
          };
        });
      },
      resetTimer: () => {
        set(() => ({
          timer: {
            durationMs: DEFAULT_DURATION_MS,
            remainingMs: DEFAULT_DURATION_MS,
            status: "idle",
            startedAt: undefined,
          },
        }));
      },
      tickTimer: () => {
        set((state) => {
          if (state.timer.status !== "running") return state;
          const next = state.timer.remainingMs - 1000;
          if (next <= 0) {
            return {
              timer: {
                ...state.timer,
                remainingMs: 0,
                status: "finished",
                startedAt: undefined,
              },
            };
          }
          return {
            timer: {
              ...state.timer,
              remainingMs: next,
            },
          };
        });
      },
    }),
    {
      name: "quest-app-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        teams: state.teams,
        timer: state.timer,
      }),
    },
  ),
);

export function subscribeHydration(cb: () => void) {
  return useQuestStore.persist.onFinishHydration(cb);
}

export function getQuestPersistHasHydrated() {
  return useQuestStore.persist.hasHydrated();
}
