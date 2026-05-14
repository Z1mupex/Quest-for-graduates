"use client";

import { useEffect } from "react";
import { useQuestStore } from "@/lib/store";

export function TimerTicker() {
  const tickTimer = useQuestStore((s) => s.tickTimer);
  const status = useQuestStore((s) => s.timer.status);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      tickTimer();
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, tickTimer]);

  return null;
}
