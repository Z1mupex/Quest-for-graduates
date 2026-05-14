"use client";

import { useState } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/TaskCard";

type CompassTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  onComplete: () => void;
};

export function CompassTask({
  title,
  description,
  meta,
  onComplete,
}: CompassTaskProps) {
  const answer = String(meta?.answer ?? "");
  const [northDone, setNorthDone] = useState(false);
  const [eastDone, setEastDone] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const ready = northDone && eastDone;

  function submit() {
    const ok =
      password.toLowerCase().trim() === answer.toLowerCase().trim();
    if (ok) {
      setError(false);
      onComplete();
    } else {
      setError(true);
    }
  }

  return (
    <TaskCard title={title} description={description} active>
      <div className="mx-auto flex max-w-xs justify-center">
        <svg
          viewBox="0 0 200 200"
          className="h-48 w-48 text-foreground"
          aria-hidden
        >
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
          <text
            x="100"
            y="24"
            textAnchor="middle"
            fill="currentColor"
            className="text-[11px] font-semibold"
          >
            С
          </text>
          <text
            x="180"
            y="106"
            textAnchor="middle"
            fill="currentColor"
            className="text-[11px] font-semibold"
          >
            В
          </text>
          <text
            x="100"
            y="188"
            textAnchor="middle"
            fill="currentColor"
            className="text-[11px] font-semibold"
          >
            Ю
          </text>
          <text
            x="20"
            y="106"
            textAnchor="middle"
            fill="currentColor"
            className="text-[11px] font-semibold"
          >
            З
          </text>
          <g transform="translate(100,100)">
            <g
              className="animate-needle-sway"
              style={{ transformOrigin: "0px 0px" }}
            >
              <g className="text-destructive">
                <polygon points="0,-70 6,0 -6,0" className="fill-current" />
              </g>
              <g className="text-muted-foreground">
                <polygon points="0,70 6,0 -6,0" className="fill-current" />
              </g>
            </g>
          </g>
          <circle cx="100" cy="100" r="6" className="fill-accent" />
        </svg>
      </div>

      <div className="space-y-3 text-center text-lg font-semibold">
        <div className="flex items-center justify-center gap-2">
          <ArrowDown className="h-6 w-6 text-accent" aria-hidden />
          <span>50 шагов на Север (0°)</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <ArrowRight className="h-6 w-6 text-accent" aria-hidden />
          <span>15 шагов на Восток (90°)</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition hover:bg-muted"
          onClick={() => setNorthDone((v) => !v)}
        >
          {northDone ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
          <span>50 шагов на Север</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition hover:bg-muted"
          onClick={() => setEastDone((v) => !v)}
        >
          {eastDone ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
          <span>15 шагов на Восток</span>
        </button>
      </div>

      {ready ? (
        <div className="space-y-3">
          <Input
            placeholder="Пароль из конверта"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
          {error ? (
            <p className="text-sm text-destructive">Неверный ответ</p>
          ) : null}
          <Button type="button" className="w-full" onClick={submit}>
            Ввести пароль из конверта
          </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Отметьте оба пункта, чтобы ввести пароль.
        </p>
      )}
    </TaskCard>
  );
}
