"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/TaskCard";
import { QUIZ_QUESTIONS, answersMatch } from "@/lib/quest-config";

const COOLDOWN_MS = 20_000;

type SchoolQuizTaskProps = {
  title: string;
  description: string;
  onComplete: () => void;
};

export function SchoolQuizTask({
  title,
  description,
  onComplete,
}: SchoolQuizTaskProps) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (!cooldownEnd) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0) setCooldownEnd(null);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [cooldownEnd]);

  const onCooldown = cooldownEnd != null && cooldownLeft > 0;
  const current = QUIZ_QUESTIONS[index];

  function submitAnswer() {
    if (onCooldown || !current) return;
    if (answersMatch(value, current.answer)) {
      setError(false);
      setValue("");
      if (index + 1 >= QUIZ_QUESTIONS.length) {
        onComplete();
      } else {
        setIndex((i) => i + 1);
      }
    } else {
      setError(true);
      setCooldownEnd(Date.now() + COOLDOWN_MS);
    }
  }

  return (
    <TaskCard title={title} description={description} active>
      <p className="text-xs text-muted-foreground">
        Вопрос {index + 1} из {QUIZ_QUESTIONS.length}
      </p>
      <p className="text-sm font-medium leading-relaxed">{current?.question}</p>
      <div className="space-y-2">
        <Input
          placeholder="Ваш ответ"
          value={value}
          disabled={onCooldown}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitAnswer();
          }}
        />
        {error && !onCooldown ? (
          <p className="text-sm text-destructive">Неверный ответ</p>
        ) : null}
        {onCooldown ? (
          <p className="font-mono text-lg text-destructive">
            Повтор через: {cooldownLeft} с
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        className="w-full"
        disabled={onCooldown}
        onClick={submitAnswer}
      >
        Проверить
      </Button>
    </TaskCard>
  );
}
