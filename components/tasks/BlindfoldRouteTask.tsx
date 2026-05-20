"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/TaskCard";
import { CodeWordInput } from "@/components/tasks/CodeWordInput";
import { BLINDFOLD_STEPS } from "@/lib/quest-config";

type BlindfoldRouteTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  onComplete: () => void;
};

export function BlindfoldRouteTask({
  title,
  description,
  meta,
  onComplete,
}: BlindfoldRouteTaskProps) {
  const codeWord = String(meta?.codeWord ?? "ответ");
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  if (finished) {
    return (
      <TaskCard title={title} description={description} active>
        <CodeWordInput answer={codeWord} onCorrect={onComplete} />
      </TaskCard>
    );
  }

  if (!started) {
    return (
      <TaskCard title={title} description={description} active>
        <Button type="button" className="w-full" size="lg" onClick={() => setStarted(true)}>
          Начать
        </Button>
      </TaskCard>
    );
  }

  const step = BLINDFOLD_STEPS[stepIndex];
  const isLast = stepIndex === BLINDFOLD_STEPS.length - 1;

  return (
    <TaskCard title={title} active>
      <p className="text-xs text-muted-foreground">
        Шаг {stepIndex + 1} из {BLINDFOLD_STEPS.length}
      </p>
      <Card>
        <CardContent className="p-6 text-lg font-medium leading-relaxed">
          {step}
        </CardContent>
      </Card>
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          if (isLast) {
            setFinished(true);
          } else {
            setStepIndex((i) => i + 1);
          }
        }}
      >
        {isLast ? "Готово" : "Далее"}
      </Button>
    </TaskCard>
  );
}
