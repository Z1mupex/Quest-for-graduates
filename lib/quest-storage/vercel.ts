import { del, head, put } from "@vercel/blob";
import type { ApprovalSubmission, QuestState } from "@/lib/quest-types";
import {
  createInitialQuestState,
  createInitialTeams,
  resolveTimer,
} from "@/lib/quest-state-core";
import type { QuestStorage } from "@/lib/quest-storage/types";

const STATE_PATH = "quest-state.json";
const submissionPath = (teamId: string) => `submissions/${teamId}.json`;

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function assertBlob() {
  if (!hasBlob()) {
    throw new Error(
      "Vercel Blob не настроен. Storage → Blob в проекте Vercel, затем Redeploy.",
    );
  }
}

async function readJsonBlob<T>(pathname: string): Promise<T | null> {
  try {
    const meta = await head(pathname);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function writeJsonBlob(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function deleteBlob(pathname: string): Promise<void> {
  try {
    const meta = await head(pathname);
    await del(meta.url);
  } catch {
    // ignore
  }
}

export const vercelQuestStorage: QuestStorage = {
  async readState() {
    assertBlob();
    const parsed = await readJsonBlob<QuestState>(STATE_PATH);
    if (!parsed) {
      const initial = createInitialQuestState();
      await writeJsonBlob(STATE_PATH, initial);
      return initial;
    }
    return {
      teams: { ...createInitialTeams(), ...parsed.teams },
      timer: resolveTimer(parsed.timer ?? createInitialQuestState().timer),
    };
  },

  async writeState(state) {
    assertBlob();
    await writeJsonBlob(STATE_PATH, state);
  },

  async saveSubmission(teamId, submission) {
    assertBlob();
    await writeJsonBlob(submissionPath(teamId), submission);
  },

  async loadSubmission(teamId) {
    assertBlob();
    return readJsonBlob<ApprovalSubmission>(submissionPath(teamId));
  },

  async deleteSubmission(teamId) {
    assertBlob();
    await deleteBlob(submissionPath(teamId));
  },
};
