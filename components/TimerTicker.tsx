"use client";

import { useEffect } from "react";
import { useQuestStore } from "@/lib/store";

/**
 * Локальный отсчёт в UI. На сервер пишем только старт/пауза/сброс —
 * иначе Blob перезаписывался каждую секунду и затирал прогресс команд.
 */
export function TimerTicker() {
  const tickTimerLocal = useQuestStore((s) => s.tickTimerLocal);
  const status = useQuestStore((s) => s.timer.status);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      tickTimerLocal();
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, tickTimerLocal]);

  return null;
}
