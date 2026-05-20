"use client";

import { TaskCard } from "@/components/TaskCard";
import { CodeWordInput } from "@/components/tasks/CodeWordInput";

type RopeLockTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  onComplete: () => void;
};

export function RopeLockTask({
  title,
  description,
  meta,
  onComplete,
}: RopeLockTaskProps) {
  const codeWord = String(meta?.codeWord ?? "ответ");

  return (
    <TaskCard title={title} description={description} active>
      <CodeWordInput answer={codeWord} onCorrect={onComplete} />
    </TaskCard>
  );
}
