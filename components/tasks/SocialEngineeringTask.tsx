"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/TaskCard";
import { patchQuest } from "@/lib/quest-api";
import { useQuestStore } from "@/lib/store";

type SocialEngineeringTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  teamId: string;
  onComplete: () => void;
};

export function SocialEngineeringTask({
  title,
  description,
  meta,
  teamId,
  onComplete,
}: SocialEngineeringTaskProps) {
  const correctAnswer = String(meta?.correctAnswer ?? "");
  const maxAttempts = Number(meta?.maxAttempts ?? 3);
  const penaltyActive = useQuestStore(
    (s) => s.teams[teamId]?.penaltyActive ?? false,
  );

  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [penaltyTriggered, setPenaltyTriggered] = useState(false);
  const [error, setError] = useState(false);
  const prevPenalty = useRef(false);

  useEffect(() => {
    if (prevPenalty.current && !penaltyActive) {
      setAttempts(0);
      setPenaltyTriggered(false);
      setValue("");
      setError(false);
    }
    prevPenalty.current = penaltyActive;
  }, [penaltyActive]);

  const remaining = Math.max(0, maxAttempts - attempts);

  function submit() {
    if (penaltyActive || penaltyTriggered) return;
    const ok =
      value.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    if (ok) {
      setError(false);
      onComplete();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setError(true);
    if (next >= maxAttempts) {
      setPenaltyTriggered(true);
      void patchQuest({ action: "triggerPenalty", teamId });
    }
  }

  return (
    <TaskCard title={title} description={description} active>
      <div className="space-y-2">
        <Input
          placeholder="Ключ из комментария"
          value={value}
          disabled={penaltyActive || penaltyTriggered}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        {error && !penaltyTriggered ? (
          <p className="text-sm text-destructive">Неверный ответ</p>
        ) : null}
        {!penaltyTriggered && !penaltyActive ? (
          <p className="text-xs text-muted-foreground">
            Осталось попыток: {remaining}
          </p>
        ) : null}
      </div>
      {(penaltyTriggered || penaltyActive) && (
        <div
          className="w-full rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          Штраф! Вся команда должна добежать до ворот школы и вернуться.
          Сообщите администратору о штрафе.
        </div>
      )}
      <Button
        type="button"
        className="w-full"
        onClick={submit}
        disabled={penaltyActive || penaltyTriggered}
      >
        Ввести ключ
      </Button>
    </TaskCard>
  );
}
