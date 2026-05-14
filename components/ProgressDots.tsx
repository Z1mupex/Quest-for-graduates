"use client";

import { cn } from "@/lib/utils";

type ProgressDotsProps = {
  currentStep: number;
  completedSteps: number[];
};

export function ProgressDots({ currentStep, completedSteps }: ProgressDotsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: 9 }, (_, i) => {
        const step = i + 1;
        const done = completedSteps.includes(step);
        const active = currentStep === step && !done;
        return (
          <div
            key={step}
            className={cn(
              "h-3 w-3 rounded-full border border-border transition-all",
              done && "bg-accent",
              active && "scale-110 bg-accent/40 ring-2 ring-accent animate-pulse-ring",
              !done && !active && "bg-muted",
            )}
            aria-label={`Шаг ${step}${done ? " выполнен" : active ? " текущий" : ""}`}
          />
        );
      })}
    </div>
  );
}
