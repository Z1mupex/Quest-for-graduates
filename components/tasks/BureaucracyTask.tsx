"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/TaskCard";

type BureaucracyTaskProps = {
  title: string;
  description: string;
  answer: string;
  onComplete: () => void;
};

export function BureaucracyTask({
  title,
  description,
  answer,
  onComplete,
}: BureaucracyTaskProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    const ok =
      value.toLowerCase().trim() === answer.toLowerCase().trim();
    if (ok) {
      setError(false);
      onComplete();
    } else {
      setError(true);
    }
  }

  return (
    <TaskCard title={title} description={description} active>
      <div className="space-y-2">
        <Input
          placeholder="Секретное слово"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        {error ? (
          <p className="text-sm text-destructive">Неверный ответ</p>
        ) : null}
      </div>
      <Button type="button" className="w-full" onClick={submit}>
        Проверить
      </Button>
    </TaskCard>
  );
}
