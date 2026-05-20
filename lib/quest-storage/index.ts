import { fileQuestStorage } from "@/lib/quest-storage/file";
import { vercelQuestStorage } from "@/lib/quest-storage/vercel";
import type { QuestStorage } from "@/lib/quest-storage/types";

function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

function hasBlobEnv(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function getQuestStorage(): QuestStorage {
  if (isVercel() || hasBlobEnv()) {
    return vercelQuestStorage;
  }
  return fileQuestStorage;
}

export function getStorageBackendName(): string {
  if (isVercel() || hasBlobEnv()) return "vercel-blob";
  return "file";
}
