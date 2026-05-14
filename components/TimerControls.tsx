"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuestStore } from "@/lib/store";

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerControls() {
  const timer = useQuestStore((s) => s.timer);
  const startTimer = useQuestStore((s) => s.startTimer);
  const pauseTimer = useQuestStore((s) => s.pauseTimer);
  const resetTimer = useQuestStore((s) => s.resetTimer);
  const [soundHint, setSoundHint] = useState(true);

  const statusLabel =
    timer.status === "idle"
      ? "ОЖИДАНИЕ"
      : timer.status === "running"
        ? "ИДЁТ"
        : timer.status === "paused"
          ? "ПАУЗА"
          : "ЗАВЕРШЁН";

  const statusVariant =
    timer.status === "running"
      ? "default"
      : timer.status === "finished"
        ? "destructive"
        : "secondary";

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-8 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Таймер</h2>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
      <div className="font-mono text-5xl tabular-nums tracking-tight">
        {formatClock(timer.remainingMs)}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => startTimer()}>
          ▶ Старт
        </Button>
        <Button type="button" variant="secondary" onClick={() => pauseTimer()}>
          ⏸ Пауза
        </Button>
        <Button type="button" variant="outline" onClick={() => resetTimer()}>
          ↺ Сброс
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
        <div className="space-y-1">
          <Label htmlFor="sound-hint" className="text-sm">
            Подсказки оставшемуся времени
          </Label>
          <p className="text-xs text-muted-foreground">
            Локальная настройка интерфейса администратора.
          </p>
        </div>
        <Switch
          id="sound-hint"
          checked={soundHint}
          onCheckedChange={setSoundHint}
          aria-label="Подсказки оставшемуся времени"
        />
      </div>
    </div>
  );
}
