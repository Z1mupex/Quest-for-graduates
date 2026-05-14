"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/TaskCard";

type CrocodileTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  onComplete: () => void;
};

export function CrocodileTask({
  title,
  meta,
  onComplete,
}: CrocodileTaskProps) {
  const word = String(meta?.word ?? "");
  const confirmWord = String(meta?.confirmWord ?? "");
  const [wordVisible, setWordVisible] = useState(false);
  const [guess, setGuess] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    const ok =
      guess.toLowerCase().trim() === confirmWord.toLowerCase().trim();
    if (ok) {
      setError(false);
      onComplete();
    } else {
      setError(true);
    }
  }

  return (
    <TaskCard
      title={title}
      description="Объясните это слово любому встречному ученику из младших классов только жестами — без слов и звуков. Оператор снимает видео. Как только ученик угадал — вернитесь и введите угаданное слово ниже."
      active
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/40 p-8">
        <div
          className={`font-mono text-5xl font-bold tracking-tight transition-all md:text-6xl ${
            wordVisible ? "" : "blur-xl select-none"
          }`}
        >
          {word}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setWordVisible(true)}
        >
          Показать слово команде
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Угаданное слово"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        {error ? (
          <p className="text-sm text-destructive">Неверный ответ</p>
        ) : null}
      </div>
      <Button type="button" className="w-full" onClick={submit}>
        Подтвердить
      </Button>
    </TaskCard>
  );
}
