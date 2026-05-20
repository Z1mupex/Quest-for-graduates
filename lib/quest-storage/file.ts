import { promises as fs } from "fs";
import path from "path";
import type { ApprovalSubmission, QuestState } from "@/lib/quest-types";
import type { QuestTeamsSnapshot } from "@/lib/quest-types";
import type { TimerState } from "@/lib/quest-types";
import {
  initialTeamsSnapshot,
  initialTimer,
  legacyToSnapshot,
  mergeQuestState,
  teamsSnapshotFromState,
} from "@/lib/quest-storage/split-state";
import type { QuestStorage } from "@/lib/quest-storage/types";

const DATA_DIR = path.join(process.cwd(), "data");
const TEAMS_PATH = path.join(DATA_DIR, "quest-teams.json");
const TIMER_PATH = path.join(DATA_DIR, "quest-timer.json");
const LEGACY_STATE_PATH = path.join(DATA_DIR, "quest-state.json");
const SUBMISSIONS_DIR = path.join(DATA_DIR, "submissions");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function readTeamsSnapshot(): Promise<QuestTeamsSnapshot> {
  const teams = await readJsonFile<QuestTeamsSnapshot>(TEAMS_PATH);
  if (teams) return teams;

  const legacy = await readJsonFile<QuestState>(LEGACY_STATE_PATH);
  if (legacy) {
    const { teams: snap, timer } = legacyToSnapshot(legacy);
    await fs.writeFile(TEAMS_PATH, JSON.stringify(snap, null, 2), "utf8");
    await fs.writeFile(TIMER_PATH, JSON.stringify(timer, null, 2), "utf8");
    return snap;
  }

  return initialTeamsSnapshot();
}

async function readTimer(): Promise<TimerState> {
  const timer = await readJsonFile<TimerState>(TIMER_PATH);
  if (timer) return timer;

  const legacy = await readJsonFile<QuestState>(LEGACY_STATE_PATH);
  if (legacy) {
    const { teams: snap, timer: t } = legacyToSnapshot(legacy);
    await fs.writeFile(TEAMS_PATH, JSON.stringify(snap, null, 2), "utf8");
    await fs.writeFile(TIMER_PATH, JSON.stringify(t, null, 2), "utf8");
    return t;
  }

  return initialTimer();
}

export const fileQuestStorage: QuestStorage = {
  async readState() {
    await ensureDirs();
    try {
      const [teamsSnap, timer] = await Promise.all([
        readTeamsSnapshot(),
        readTimer(),
      ]);
      return mergeQuestState(teamsSnap, timer);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
      const initial = mergeQuestState(
        initialTeamsSnapshot(),
        initialTimer(),
      );
      try {
        await this.writeState(initial);
      } catch {
        // read-only FS
      }
      return initial;
    }
  },

  async writeTeams(snapshot) {
    await ensureDirs();
    await fs.writeFile(TEAMS_PATH, JSON.stringify(snapshot, null, 2), "utf8");
  },

  async writeState(state) {
    await ensureDirs();
    const snap = teamsSnapshotFromState(state);
    await Promise.all([
      fs.writeFile(TEAMS_PATH, JSON.stringify(snap, null, 2), "utf8"),
      fs.writeFile(TIMER_PATH, JSON.stringify(state.timer, null, 2), "utf8"),
    ]);
  },

  async writeTimer(timer) {
    await ensureDirs();
    await fs.writeFile(TIMER_PATH, JSON.stringify(timer, null, 2), "utf8");
  },

  async saveSubmission(teamId, submission) {
    await ensureDirs();
    const filePath = path.join(SUBMISSIONS_DIR, `${teamId}.json`);
    await fs.writeFile(filePath, JSON.stringify(submission), "utf8");
  },

  async loadSubmission(teamId) {
    await ensureDirs();
    const filePath = path.join(SUBMISSIONS_DIR, `${teamId}.json`);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw) as ApprovalSubmission;
    } catch {
      return null;
    }
  },

  async deleteSubmission(teamId) {
    const filePath = path.join(SUBMISSIONS_DIR, `${teamId}.json`);
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
  },
};
