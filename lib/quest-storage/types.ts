import type {
  ApprovalSubmission,
  QuestState,
  QuestTeamsSnapshot,
} from "@/lib/quest-types";
import type { TimerState } from "@/lib/quest-types";

export type QuestStorage = {
  readState: () => Promise<QuestState>;
  writeTeams: (snapshot: QuestTeamsSnapshot) => Promise<void>;
  writeState: (state: QuestState) => Promise<void>;
  writeTimer: (timer: TimerState) => Promise<void>;
  saveSubmission: (teamId: string, submission: ApprovalSubmission) => Promise<void>;
  loadSubmission: (teamId: string) => Promise<ApprovalSubmission | null>;
  deleteSubmission: (teamId: string) => Promise<void>;
};
