import { create } from "zustand";
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
      const localRevision = current.revision ?? 0;
      if (current.hydrated && incomingRevision < localRevision) {
        return current;
      }
      return {
        teams: state.teams,
        timer: state.timer,
        revision: Math.max(incomingRevision, localRevision),
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
