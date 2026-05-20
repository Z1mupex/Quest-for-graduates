import type { ApprovalSubmission, QuestState } from "@/lib/quest-types";
import type { TimerState } from "@/lib/quest-types";

export type QuestStorage = {
  readState: () => Promise<QuestState>;
  writeState: (state: QuestState) => Promise<void>;
  writeTimer: (timer: TimerState) => Promise<void>;
  saveSubmission: (teamId: string, submission: ApprovalSubmission) => Promise<void>;
  loadSubmission: (teamId: string) => Promise<ApprovalSubmission | null>;
  deleteSubmission: (teamId: string) => Promise<void>;
};
