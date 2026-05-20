import { del, get, put } from "@vercel/blob";
import type { ApprovalSubmission, QuestState } from "@/lib/quest-types";
import type { QuestTeamsSnapshot } from "@/lib/quest-types";
import type { TimerState } from "@/lib/quest-types";
import {
  initialTeamsSnapshot,
  initialTimer,
  legacyToSnapshot,
  mergeQuestState,
  LEGACY_STATE_BLOB_PATH,
  TEAMS_BLOB_PATH,
  TIMER_BLOB_PATH,
} from "@/lib/quest-storage/split-state";
import type { QuestStorage } from "@/lib/quest-storage/types";

const submissionPath = (teamId: string) => `submissions/${teamId}.json`;

const blobAccess = { access: "private" as const };

function assertBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob не настроен. Storage → Blob в проекте Vercel, затем Redeploy.",
    );
  }
}

async function readJsonBlob<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, {
      ...blobAccess,
      useCache: false,
    });
    if (result?.statusCode === 200 && result.stream) {
      const text = await new Response(result.stream).text();
      return JSON.parse(text) as T;
    }
  } catch {
    // пробуем старые public-файлы
  }

  try {
    const { head } = await import("@vercel/blob");
    const meta = await head(pathname);
    const res = await fetch(`${meta.url}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function writeJsonBlob(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    ...blobAccess,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function deleteBlob(pathname: string): Promise<void> {
  try {
    await del(pathname);
  } catch {
    // ignore
  }
}

async function readTeamsSnapshot(): Promise<QuestTeamsSnapshot> {
  const teams = await readJsonBlob<QuestTeamsSnapshot>(TEAMS_BLOB_PATH);
  if (teams) return teams;

  const legacy = await readJsonBlob<QuestState>(LEGACY_STATE_BLOB_PATH);
  if (legacy) {
    const { teams: snap, timer } = legacyToSnapshot(legacy);
    await writeJsonBlob(TEAMS_BLOB_PATH, snap);
    await writeJsonBlob(TIMER_BLOB_PATH, timer);
    return snap;
  }

  const initial = initialTeamsSnapshot();
  await writeJsonBlob(TEAMS_BLOB_PATH, initial);
  return initial;
}

async function readTimer(): Promise<TimerState> {
  const timer = await readJsonBlob<TimerState>(TIMER_BLOB_PATH);
  if (timer) return timer;

  const legacy = await readJsonBlob<QuestState>(LEGACY_STATE_BLOB_PATH);
  if (legacy) {
    const { teams: snap, timer: t } = legacyToSnapshot(legacy);
    await writeJsonBlob(TEAMS_BLOB_PATH, snap);
    await writeJsonBlob(TIMER_BLOB_PATH, t);
    return t;
  }

  const initial = initialTimer();
  await writeJsonBlob(TIMER_BLOB_PATH, initial);
  return initial;
}

export const vercelQuestStorage: QuestStorage = {
  async readState() {
    assertBlob();
    const [teamsSnap, timer] = await Promise.all([
      readTeamsSnapshot(),
      readTimer(),
    ]);
    return mergeQuestState(teamsSnap, timer);
  },

  async writeTeams(snapshot) {
    assertBlob();
    await writeJsonBlob(TEAMS_BLOB_PATH, snapshot);
  },

  async writeTimer(timer) {
    assertBlob();
    await writeJsonBlob(TIMER_BLOB_PATH, timer);
  },

  async writeState(state) {
    assertBlob();
    await Promise.all([
      writeJsonBlob(TEAMS_BLOB_PATH, {
        teams: state.teams,
        revision: state.revision ?? 0,
      }),
      writeJsonBlob(TIMER_BLOB_PATH, state.timer),
    ]);
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
