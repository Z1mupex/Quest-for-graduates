import { del, get, head, put } from "@vercel/blob";
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
import { StaleQuestWriteError, type QuestStorage } from "@/lib/quest-storage/types";

const submissionPath = (teamId: string) => `submissions/${teamId}.json`;

async function readJsonBlob<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, {
      access: "public",
      useCache: false,
    });
    if (result?.statusCode === 200 && result.stream) {
      const text = await new Response(result.stream).text();
      return JSON.parse(text) as T;
    }
  } catch {
    // Fall back to the blob URL below.
  }

  try {
    const meta = await head(pathname);
    const res = await fetch(`${meta.url}?v=${Date.now()}`, {
      cache: "no-store",
    });
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
    cacheControlMaxAge: 60,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function writeJsonBlobIfMatch(
  pathname: string,
  data: unknown,
  etag: string,
): Promise<void> {
  try {
    await put(pathname, JSON.stringify(data), {
      access: "public",
      contentType: "application/json",
      cacheControlMaxAge: 60,
      addRandomSuffix: false,
      allowOverwrite: true,
      ifMatch: etag,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "BlobPreconditionFailedError") {
      throw new StaleQuestWriteError();
    }
    throw err;
  }
}

async function deleteBlob(pathname: string): Promise<void> {
  try {
    await del(pathname);
  } catch {
    // ignore
  }
}

async function migrateLegacyIfNeeded(): Promise<QuestTeamsSnapshot | null> {
  const legacy = await readJsonBlob<QuestState>(LEGACY_STATE_BLOB_PATH);
  if (!legacy) return null;

  const { teams: snap, timer } = legacyToSnapshot(legacy);
  await writeJsonBlob(TEAMS_BLOB_PATH, snap);
  await writeJsonBlob(TIMER_BLOB_PATH, timer);
  await deleteBlob(LEGACY_STATE_BLOB_PATH);
  return snap;
}

async function readTeamsSnapshot(): Promise<QuestTeamsSnapshot> {
  const teams = await readJsonBlob<QuestTeamsSnapshot>(TEAMS_BLOB_PATH);
  if (teams?.teams && Object.keys(teams.teams).length > 0) {
    return teams;
  }

  const migrated = await migrateLegacyIfNeeded();
  if (migrated) return migrated;

  if (teams) return teams;

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
    await deleteBlob(LEGACY_STATE_BLOB_PATH);
    return t;
  }

  const initial = initialTimer();
  await writeJsonBlob(TIMER_BLOB_PATH, initial);
  return initial;
}

export const vercelQuestStorage: QuestStorage = {
  async readState() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "Vercel Blob не настроен. Storage -> Blob в проекте Vercel, затем Redeploy.",
      );
    }
    const [teamsSnap, timer] = await Promise.all([
      readTeamsSnapshot(),
      readTimer(),
    ]);
    return mergeQuestState(teamsSnap, timer);
  },

  async writeTeams(snapshot) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob не настроен.");
    }

    let meta;
    try {
      meta = await head(TEAMS_BLOB_PATH);
    } catch {
      await writeJsonBlob(TEAMS_BLOB_PATH, snapshot);
      return;
    }

    const current = await readJsonBlob<QuestTeamsSnapshot>(TEAMS_BLOB_PATH);
    if (current && (current.revision ?? 0) >= snapshot.revision) {
      throw new StaleQuestWriteError();
    }

    await writeJsonBlobIfMatch(TEAMS_BLOB_PATH, snapshot, meta.etag);
  },

  async writeTimer(timer) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob не настроен.");
    }
    await writeJsonBlob(TIMER_BLOB_PATH, timer);
  },

  async writeState(state) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob не настроен.");
    }
    await Promise.all([
      writeJsonBlob(TEAMS_BLOB_PATH, {
        teams: state.teams,
        revision: state.revision ?? 0,
      }),
      writeJsonBlob(TIMER_BLOB_PATH, state.timer),
    ]);
  },

  async saveSubmission(teamId, submission) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob не настроен.");
    }
    await writeJsonBlob(submissionPath(teamId), submission);
  },

  async loadSubmission(teamId) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob не настроен.");
    }
    return readJsonBlob<ApprovalSubmission>(submissionPath(teamId));
  },

  async deleteSubmission(teamId) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob не настроен.");
    }
    await deleteBlob(submissionPath(teamId));
  },
};
