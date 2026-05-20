import { getQuestStorage } from "@/lib/quest-storage";
import type { ApprovalSubmission, QuestState } from "@/lib/quest-types";

export {
  createInitialQuestState,
  createInitialTeams,
  completeTeamStep,
  resolveTimer,
  DEFAULT_DURATION_MS,
} from "@/lib/quest-state-core";

export async function readQuestState(): Promise<QuestState> {
  return getQuestStorage().readState();
}

export async function writeQuestState(state: QuestState): Promise<void> {
  await getQuestStorage().writeState(state);
}

export async function saveSubmission(
  teamId: string,
  submission: ApprovalSubmission,
): Promise<void> {
  await getQuestStorage().saveSubmission(teamId, submission);
}

export async function loadSubmission(
  teamId: string,
): Promise<ApprovalSubmission | null> {
  return getQuestStorage().loadSubmission(teamId);
}

export async function deleteSubmission(teamId: string): Promise<void> {
  await getQuestStorage().deleteSubmission(teamId);
}

export async function mutateQuestState(
  mutator: (state: QuestState) => QuestState,
): Promise<QuestState> {
  const storage = getQuestStorage();
  const current = await storage.readState();
  const next = mutator(current);
  await storage.writeState(next);
  return storage.readState();
}
