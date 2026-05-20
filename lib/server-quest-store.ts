import { getQuestStorage } from "@/lib/quest-storage";
import type { ApprovalSubmission, QuestState, TimerState } from "@/lib/quest-types";
import {
  completeTeamStep,
  createInitialQuestState,
  createInitialTeams,
  DEFAULT_DURATION_MS,
  resolveTimer,
} from "@/lib/quest-state-core";

export {
  createInitialQuestState,
  createInitialTeams,
  completeTeamStep,
  resolveTimer,
  DEFAULT_DURATION_MS,
};

const MUTATE_MAX_RETRIES = 6;

function teamProgressChanged(
  before: QuestState,
  after: QuestState,
  teamId: string,
  step: number,
): boolean {
  const prev = before.teams[teamId];
  const next = after.teams[teamId];
  if (!prev || !next) return false;
  return (
    next.currentStep !== prev.currentStep ||
    next.completedSteps.includes(step)
  );
}

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

export async function loadSubmission(teamId: string) {
  return getQuestStorage().loadSubmission(teamId);
}

export async function deleteSubmission(teamId: string): Promise<void> {
  await getQuestStorage().deleteSubmission(teamId);
}

/** Запись только таймера — не затирает прогресс команд. */
export async function mutateQuestTimer(
  mutator: (timer: TimerState) => TimerState,
): Promise<QuestState> {
  const storage = getQuestStorage();
  const current = await storage.readState();
  const nextTimer = mutator(current.timer);
  await storage.writeTimer(nextTimer);
  return {
    ...current,
    timer: resolveTimer(nextTimer),
  };
}

export async function mutateQuestState(
  mutator: (state: QuestState) => QuestState,
): Promise<QuestState> {
  const storage = getQuestStorage();

  for (let attempt = 0; attempt < MUTATE_MAX_RETRIES; attempt++) {
    const current = await storage.readState();
    const mutated = mutator(current);
    const teamsChanged =
      JSON.stringify(mutated.teams) !== JSON.stringify(current.teams);
    const timerChanged =
      JSON.stringify(mutated.timer) !== JSON.stringify(current.timer);
    if (!teamsChanged && !timerChanged) {
      return current;
    }

    const nextRevision = (current.revision ?? 0) + 1;
    const result: QuestState = {
      ...mutated,
      revision: nextRevision,
    };

    await storage.writeState(result);

    const verified = await storage.readState();
    if ((verified.revision ?? 0) >= nextRevision) {
      return verified;
    }
  }

  throw new Error(
    "Не удалось сохранить состояние квеста. Повторите действие.",
  );
}

export function didCompleteStep(
  before: QuestState,
  after: QuestState,
  teamId: string,
  step: number,
): boolean {
  return teamProgressChanged(before, after, teamId, step);
}
