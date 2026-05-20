export type StopFrameSubmission = {
  type: "stopFrame";
  photos: { scene: string; dataUrl: string }[];
};

export type AIAccusationsSubmission = {
  type: "aiAccusations";
  items: { accusation: string; rebuttal: string; dataUrl: string }[];
};

export type ApprovalSubmission = StopFrameSubmission | AIAccusationsSubmission;

export type TeamState = {
  currentStep: number;
  completedSteps: number[];
  penaltyActive: boolean;
  finishedAt?: number;
  approvalPendingStep?: number;
};

export type TimerState = {
  durationMs: number;
  remainingMs: number;
  status: "idle" | "running" | "paused" | "finished";
  startedAt?: number;
  updatedAt?: number;
};

export type QuestState = {
  teams: Record<string, TeamState>;
  timer: TimerState;
  /** Версия снимка команд — защита от отката при гонках записи в Blob */
  revision?: number;
};

export type QuestTeamsSnapshot = {
  teams: Record<string, TeamState>;
  revision: number;
};
