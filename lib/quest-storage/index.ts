import { fileQuestStorage } from "@/lib/quest-storage/file";
import { vercelQuestStorage } from "@/lib/quest-storage/vercel";
import type { QuestStorage } from "@/lib/quest-storage/types";

function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

function hasKvEnv(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
  );
}

export function getQuestStorage(): QuestStorage {
  if (isVercel() || hasKvEnv()) {
    return vercelQuestStorage;
  }
  return fileQuestStorage;
}

export function getStorageBackendName(): string {
  if (isVercel() || hasKvEnv()) return "vercel-kv";
  return "file";
}
