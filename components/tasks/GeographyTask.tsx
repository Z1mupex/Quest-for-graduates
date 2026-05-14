"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/TaskCard";

type GeographyTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  onComplete: () => void;
};

export function GeographyTask({
  title,
  description,
  meta,
  onComplete,
}: GeographyTaskProps) {
  const hintQuestion = String(meta?.hintQuestion ?? "");
  const hintAnswer = String(meta?.hintAnswer ?? "");
  const hint = String(meta?.hint ?? "");
  const finalAnswer = String(meta?.finalAnswer ?? "");

  const [hintUnlocked, setHintUnlocked] = useState(false);
  const [hintInput, setHintInput] = useState("");
  const [finalInput, setFinalInput] = useState("");
  const [hintError, setHintError] = useState(false);
  const [finalError, setFinalError] = useState(false);

  function unlockHint() {
    const ok =
      hintInput.toLowerCase().trim() === hintAnswer.toLowerCase().trim();
    if (ok) {
      setHintError(false);
      setHintUnlocked(true);
    } else {
      setHintError(true);
    }
  }

  function submitFinal() {
    const ok =
      finalInput.toLowerCase().trim() === finalAnswer.toLowerCase().trim();
    if (ok) {
      setFinalError(false);
      onComplete();
    } else {
      setFinalError(true);
    }
  }

  return (
    <TaskCard title={title} description={description} active>
      {!hintUnlocked ? (
        <Card className="transition-all duration-500">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {hintQuestion}
            </p>
            <Input
              placeholder="Ваш ответ"
              value={hintInput}
              onChange={(e) => setHintInput(e.target.value)}
            />
            {hintError ? (
              <p className="text-sm text-destructive">Неверный ответ</p>
            ) : null}
            <Button type="button" className="w-full" onClick={unlockHint}>
              Получить подсказку
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="rounded-2xl border-2 border-accent bg-muted/40 p-6 shadow-glow">
            <p className="text-sm leading-relaxed text-foreground">{hint}</p>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Финальный ответ"
              value={finalInput}
              onChange={(e) => setFinalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitFinal();
              }}
            />
            {finalError ? (
              <p className="text-sm text-destructive">Неверный ответ</p>
            ) : null}
          </div>
          <Button type="button" className="w-full" onClick={submitFinal}>
            Проверить
          </Button>
        </div>
      )}
    </TaskCard>
  );
}
