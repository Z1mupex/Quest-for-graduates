"use client";

import { useEffect } from "react";
import { patchQuest } from "@/lib/quest-api";
import { useQuestStore } from "@/lib/store";

type TimerTickerProps = {
  isAdmin: boolean;
};

export function TimerTicker({ isAdmin }: TimerTickerProps) {
  const tickTimerLocal = useQuestStore((s) => s.tickTimerLocal);
  const status = useQuestStore((s) => s.timer.status);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      tickTimerLocal();
      if (isAdmin) {
        void patchQuest({ action: "tickTimer" }).catch(() => {});
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, tickTimerLocal, isAdmin]);

  return null;
}
