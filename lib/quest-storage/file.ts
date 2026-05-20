import { promises as fs } from "fs";
import path from "path";
import type { ApprovalSubmission, QuestState } from "@/lib/quest-types";
import {
  createInitialQuestState,
  createInitialTeams,
  resolveTimer,
} from "@/lib/quest-state-core";
import type { QuestStorage } from "@/lib/quest-storage/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_PATH = path.join(DATA_DIR, "quest-state.json");
const SUBMISSIONS_DIR = path.join(DATA_DIR, "submissions");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
}

export const fileQuestStorage: QuestStorage = {
  async readState() {
    await ensureDirs();
    try {
      const raw = await fs.readFile(STATE_PATH, "utf8");
      const parsed = JSON.parse(raw) as QuestState;
      return {
        teams: { ...createInitialTeams(), ...parsed.teams },
        timer: resolveTimer(parsed.timer ?? createInitialQuestState().timer),
      };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
      const initial = createInitialQuestState();
      try {
        await this.writeState(initial);
      } catch {
        // read-only FS (e.g. misconfigured serverless without KV)
      }
      return initial;
    }
  },

  async writeState(state) {
    await ensureDirs();
    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
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
