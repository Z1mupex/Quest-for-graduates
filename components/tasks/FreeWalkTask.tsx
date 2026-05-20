"use client";

import { useEffect, useRef, useState } from "react";
import { TaskCard } from "@/components/TaskCard";

type FreeWalkTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  onComplete: () => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function FreeWalkTask({
  title,
  description,
  meta,
  onComplete,
}: FreeWalkTaskProps) {
  const minutes = Number(meta?.durationMinutes ?? 10);
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        setDone(true);
        onComplete();
      }
      return;
    }
    const id = window.setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft, onComplete]);

  return (
    <TaskCard title={title} description={description} active>
      <div className="flex flex-col items-center gap-4 py-6">
        <p className="font-mono text-6xl tabular-nums text-accent">
          {formatTime(Math.max(0, secondsLeft))}
        </p>
        {done ? (
          <p className="text-sm text-muted-foreground">Переход к следующему заданию…</p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Прогуляйтесь по школе. Таймер запущен автоматически.
          </p>
        )}
      </div>
    </TaskCard>
  );
}
