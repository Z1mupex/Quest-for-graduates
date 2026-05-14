"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskCard } from "@/components/TaskCard";
import { getUserById } from "@/lib/data";

type FinalTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  teamId: string;
  onComplete: () => void;
};

export function FinalTask({
  title,
  description,
  meta,
  teamId,
  onComplete,
}: FinalTaskProps) {
  const codesMeta = (meta?.codes as string[] | undefined) ?? [];
  const [codes, setCodes] = useState<[string, string, string, string]>([
    "",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const teamName = getUserById(teamId)?.name ?? "Команда";

  const allFilled = codes.every((c) => c.trim().length > 0);

  function burst() {
    const count = 3;
    for (let i = 0; i < count; i++) {
      window.setTimeout(() => {
        void confetti({
          particleCount: 120,
          spread: 80,
          origin: { x: 0.2 + i * 0.3, y: 0.3 + i * 0.1 },
        });
      }, i * 200);
    }
  }

  function submit() {
    const ok =
      codes.length === codesMeta.length &&
      codes.every(
        (c, i) =>
          c.trim().toLowerCase() ===
          String(codesMeta[i] ?? "").trim().toLowerCase(),
      );
    if (!ok) {
      setError(true);
      return;
    }
    setError(false);
    burst();
    setSuccess(true);
    window.setTimeout(() => {
      onComplete();
    }, 2200);
  }

  return (
    <TaskCard title={title} description={description} active>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {([0, 1, 2, 3] as const).map((idx) => (
          <div key={idx} className="space-y-2">
            <Label htmlFor={`code-${idx}`}>Код {idx + 1}</Label>
            <Input
              id={`code-${idx}`}
              value={codes[idx]}
              disabled={success}
              onChange={(e) => {
                const next = [...codes] as [string, string, string, string];
                next[idx] = e.target.value;
                setCodes(next);
              }}
            />
          </div>
        ))}
      </div>
      {error ? (
        <p className="text-sm text-destructive">Неверный ответ</p>
      ) : null}
      <Button
        type="button"
        className="w-full"
        disabled={!allFilled || success}
        onClick={submit}
      >
        Завершить квест
      </Button>

      {success ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 px-6 text-center backdrop-blur-sm">
          <p className="font-display text-3xl font-black md:text-4xl">
            🎉 КВЕСТ ЗАВЕРШЁН! Команда {teamName} — вы лучшие!
          </p>
        </div>
      ) : null}
    </TaskCard>
  );
}
