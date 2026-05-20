import { create } from "zustand";
import { resolveTimer } from "@/lib/quest-state-core";
import type { QuestState, TeamState, TimerState } from "@/lib/quest-types";

export type {
  ApprovalSubmission,
  AIAccusationsSubmission,
  StopFrameSubmission,
  TeamState,
  TimerState,
} from "@/lib/quest-types";

type QuestStore = QuestState & {
  hydrated: boolean;
  hydrateFromServer: (state: QuestState) => void;
  tickTimerLocal: () => void;
};

const initialTeams: QuestState["teams"] = {};

export const useQuestStore = create<QuestStore>()((set, get) => ({
  teams: initialTeams,
  timer: {
    durationMs: 0,
    remainingMs: 0,
    status: "idle",
  },
  hydrated: false,
  hydrateFromServer: (state) => {
    set((current) => {
      const incomingRevision = state.revision ?? 0;
      const currentRevision = current.revision ?? 0;
      const shouldUseTeams = !current.hydrated || incomingRevision >= currentRevision;

      const incomingTimerUpdatedAt = state.timer.updatedAt ?? 0;
      const currentTimerUpdatedAt = current.timer.updatedAt ?? 0;
      const shouldUseTimer =
        !current.hydrated || incomingTimerUpdatedAt >= currentTimerUpdatedAt;

      return {
        teams: shouldUseTeams ? state.teams : current.teams,
        timer: shouldUseTimer ? resolveTimer(state.timer) : current.timer,
        revision: shouldUseTeams ? incomingRevision : currentRevision,
        hydrated: true,
      };
    });
  },
  tickTimerLocal: () => {
    set((s) => {
      if (s.timer.status !== "running") return s;
      const next = s.timer.remainingMs - 1000;
      if (next <= 0) {
        return {
          ...s,
          timer: {
            ...s.timer,
            remainingMs: 0,
            status: "finished",
            startedAt: undefined,
          },
        };
      }
      return {
        ...s,
        timer: { ...s.timer, remainingMs: next },
      };
    });
  },
}));

export function getQuestStoreHydrated() {
  return useQuestStore.getState().hydrated;
}
