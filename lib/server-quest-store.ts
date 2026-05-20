import { promises as fs } from "fs";
import path from "path";
import { USERS } from "@/lib/data";
import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";
import type {
  ApprovalSubmission,
  QuestState,
  TeamState,
  TimerState,
} from "@/lib/quest-types";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_PATH = path.join(DATA_DIR, "quest-state.json");
const SUBMISSIONS_DIR = path.join(DATA_DIR, "submissions");

const DEFAULT_DURATION_MS = 2.5 * 60 * 60 * 1000;

function createInitialTeams(): Record<string, TeamState> {
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

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
}

export function resolveTimer(timer: TimerState): TimerState {
  if (timer.status !== "running" || timer.startedAt == null) {
    return timer;
  }
  const elapsed = Date.now() - timer.startedAt;
  const remainingMs = Math.max(0, timer.remainingMs - elapsed);
  if (remainingMs <= 0) {
    return {
      ...timer,
      remainingMs: 0,
      status: "finished",
      startedAt: undefined,
    };
  }
  return { ...timer, remainingMs };
}

export async function readQuestState(): Promise<QuestState> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as QuestState;
    return {
      teams: { ...createInitialTeams(), ...parsed.teams },
      timer: resolveTimer(parsed.timer ?? createInitialQuestState().timer),
    };
  } catch {
    const initial = createInitialQuestState();
    await writeQuestState(initial);
    return initial;
  }
}

export async function writeQuestState(state: QuestState): Promise<void> {
  await ensureDirs();
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export async function saveSubmission(
  teamId: string,
  submission: ApprovalSubmission,
): Promise<void> {
  await ensureDirs();
  const filePath = path.join(SUBMISSIONS_DIR, `${teamId}.json`);
  await fs.writeFile(filePath, JSON.stringify(submission), "utf8");
}

export async function loadSubmission(
  teamId: string,
): Promise<ApprovalSubmission | null> {
  await ensureDirs();
  const filePath = path.join(SUBMISSIONS_DIR, `${teamId}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as ApprovalSubmission;
  } catch {
    return null;
  }
}

export async function deleteSubmission(teamId: string): Promise<void> {
  const filePath = path.join(SUBMISSIONS_DIR, `${teamId}.json`);
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}

export async function mutateQuestState(
  mutator: (state: QuestState) => QuestState,
): Promise<QuestState> {
  const current = await readQuestState();
  const next = mutator(current);
  await writeQuestState(next);
  return readQuestState();
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
