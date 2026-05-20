"use client";

import { useEffect, useRef, useState } from "react";
import { fetchQuestState, QuestApiError } from "@/lib/quest-api";
import { useQuestStore } from "@/lib/store";

const POLL_MS = 3000;

type QuestSyncProps = {
  enabled: boolean;
};

export function QuestSync({ enabled }: QuestSyncProps) {
  const hydrated = useQuestStore((s) => s.hydrated);
  const [syncError, setSyncError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function sync() {
      try {
        await fetchQuestState();
        if (!cancelled) setSyncError(null);
      } catch (e) {
        if (!cancelled) {
          setSyncError(
            e instanceof QuestApiError
              ? e.message
              : "Не удалось подключиться к серверу",
          );
        }
      }
    }

    void sync();

    intervalRef.current = window.setInterval(() => {
      if (!cancelled) void sync();
    }, POLL_MS);

    const onFocus = () => void sync();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled]);

  if (!enabled) return null;

  if (!hydrated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="max-w-md space-y-2 px-6 text-center">
          <p className="text-muted-foreground">Синхронизация с сервером…</p>
          {syncError ? (
            <p className="text-sm text-destructive">{syncError}</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        {syncError}
      </div>
    );
  }

  return null;
}
