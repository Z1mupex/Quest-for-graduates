import { head, put, del } from "@vercel/blob";
import { kv } from "@vercel/kv";
import type { ApprovalSubmission, QuestState } from "@/lib/quest-types";
import {
  createInitialQuestState,
  createInitialTeams,
  resolveTimer,
} from "@/lib/quest-state-core";
import type { QuestStorage } from "@/lib/quest-storage/types";

const STATE_KEY = "quest:state";
const submissionPath = (teamId: string) => `submissions/${teamId}.json`;
const submissionKvKey = (teamId: string) => `quest:submission:${teamId}`;

function hasKv(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
  );
}

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readStateFromKv(): Promise<QuestState> {
  const parsed = await kv.get<QuestState>(STATE_KEY);
  if (!parsed) {
    const initial = createInitialQuestState();
    await kv.set(STATE_KEY, initial);
    return initial;
  }
  return {
    teams: { ...createInitialTeams(), ...parsed.teams },
    timer: resolveTimer(parsed.timer ?? createInitialQuestState().timer),
  };
}

export const vercelQuestStorage: QuestStorage = {
  async readState() {
    if (!hasKv()) {
      throw new Error(
        "Vercel KV не настроен. Storage → KV в проекте Vercel, затем Redeploy.",
      );
    }
    return readStateFromKv();
  },

  async writeState(state) {
    if (!hasKv()) {
      throw new Error("Vercel KV не настроен.");
    }
    await kv.set(STATE_KEY, state);
  },

  async saveSubmission(teamId, submission) {
    const json = JSON.stringify(submission);

    if (hasBlob()) {
      await put(submissionPath(teamId), json, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return;
    }

    if (!hasKv()) {
      throw new Error(
        "Нет хранилища для фото. Подключите Vercel Blob (или KV) в проекте.",
      );
    }

    await kv.set(submissionKvKey(teamId), submission);
  },

  async loadSubmission(teamId) {
    if (hasBlob()) {
      try {
        const meta = await head(submissionPath(teamId));
        const res = await fetch(meta.url, { cache: "no-store" });
        if (!res.ok) return null;
        return (await res.json()) as ApprovalSubmission;
      } catch {
        // fall through to KV
      }
    }

    if (!hasKv()) return null;

    const fromKv = await kv.get<ApprovalSubmission>(submissionKvKey(teamId));
    return fromKv ?? null;
  },

  async deleteSubmission(teamId) {
    if (hasBlob()) {
      try {
        const meta = await head(submissionPath(teamId));
        await del(meta.url);
      } catch {
        // ignore
      }
    }
    if (hasKv()) {
      await kv.del(submissionKvKey(teamId));
    }
  },
};
