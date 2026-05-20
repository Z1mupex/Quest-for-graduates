"use client";

import type { ApprovalSubmission, QuestState } from "@/lib/quest-types";
import { useQuestStore } from "@/lib/store";

export class QuestApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestApiError";
  }
}

async function parseResponse(res: Response): Promise<QuestState> {
  const data = (await res.json()) as QuestState & { error?: string };
  if (!res.ok) {
    throw new QuestApiError(data.error ?? "Ошибка сервера");
  }
  useQuestStore.getState().hydrateFromServer(data);
  return data;
}

export async function fetchQuestState(): Promise<QuestState> {
  const res = await fetch("/api/quest", { cache: "no-store" });
  return parseResponse(res);
}

export async function patchQuest(
  body: Record<string, unknown>,
): Promise<QuestState> {
  const res = await fetch("/api/quest", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function submitApproval(
  step: number,
  submission: ApprovalSubmission,
): Promise<QuestState> {
  const res = await fetch("/api/quest/submission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, submission }),
  });
  return parseResponse(res);
}

export async function fetchSubmission(
  teamId: string,
): Promise<ApprovalSubmission | null> {
  const res = await fetch(`/api/quest/submission?teamId=${encodeURIComponent(teamId)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  const data = (await res.json()) as { submission: ApprovalSubmission | null; error?: string };
  if (!res.ok) {
    throw new QuestApiError(data.error ?? "Не удалось загрузить материалы");
  }
  return data.submission;
}
