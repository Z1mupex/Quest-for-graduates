import type { QuestState, QuestTeamsSnapshot } from "@/lib/quest-types";
import {
  createInitialQuestState,
  createInitialTeams,
  resolveTimer,
} from "@/lib/quest-state-core";
import type { TimerState } from "@/lib/quest-types";

export const TEAMS_BLOB_PATH = "quest-teams.json";
export const TIMER_BLOB_PATH = "quest-timer.json";
/** @deprecated миграция со старого единого файла */
export const LEGACY_STATE_BLOB_PATH = "quest-state.json";

export function mergeQuestState(
  teamsSnap: QuestTeamsSnapshot,
  timer: TimerState,
): QuestState {
  return {
    teams: { ...createInitialTeams(), ...teamsSnap.teams },
    timer: resolveTimer(timer),
    revision: teamsSnap.revision,
  };
}

export function teamsSnapshotFromState(state: QuestState): QuestTeamsSnapshot {
  return {
    teams: state.teams,
    revision: state.revision ?? 0,
  };
}

export function initialTeamsSnapshot(): QuestTeamsSnapshot {
  const initial = createInitialQuestState();
  return { teams: initial.teams, revision: 0 };
}

export function initialTimer(): TimerState {
  return createInitialQuestState().timer;
}

export function legacyToSnapshot(legacy: QuestState): {
  teams: QuestTeamsSnapshot;
  timer: TimerState;
} {
  return {
    teams: {
      teams: legacy.teams,
      revision: legacy.revision ?? 0,
    },
    timer: legacy.timer ?? initialTimer(),
  };
}
