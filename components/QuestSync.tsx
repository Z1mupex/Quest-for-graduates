"use client";

import { useEffect, useRef } from "react";
import { fetchQuestState } from "@/lib/quest-api";
import { useQuestStore } from "@/lib/store";

const POLL_MS = 3000;

type QuestSyncProps = {
  enabled: boolean;
};

export function QuestSync({ enabled }: QuestSyncProps) {
  const hydrated = useQuestStore((s) => s.hydrated);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function sync() {
      try {
        await fetchQuestState();
      } catch {
        // повторим на следующем интервале
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

  if (!enabled || hydrated) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <p className="text-muted-foreground">Синхронизация с сервером…</p>
    </div>
  );
}
