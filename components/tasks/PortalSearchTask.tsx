"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/TaskCard";
import { answersMatch } from "@/lib/quest-config";

type PortalSearchTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  onComplete: () => void;
};

export function PortalSearchTask({
  title,
  description,
  meta,
  onComplete,
}: PortalSearchTaskProps) {
  const hint1 = String(meta?.hint1 ?? "");
  const hint2 = String(meta?.hint2 ?? "");
  const answer = String(meta?.answer ?? "команда-козел");
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    if (answersMatch(value, answer)) {
      setError(false);
      onComplete();
    } else {
      setError(true);
    }
  }

  return (
    <TaskCard title={title} description={description} active>
      <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p>{hint1}</p>
        <p>{hint2}</p>
      </div>
      <Input
        placeholder="слово-слово"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      {error ? (
        <p className="text-sm text-destructive">Неверный ответ</p>
      ) : null}
      <Button type="button" className="w-full" onClick={submit}>
        Проверить
      </Button>
    </TaskCard>
  );
}
