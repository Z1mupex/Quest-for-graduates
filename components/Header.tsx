"use client";

import { useMemo } from "react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SessionPayload } from "@/lib/auth";
import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";
import { useQuestStore } from "@/lib/store";

const FINISHED_STEP = TOTAL_QUEST_STEPS + 1;

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

type HeaderProps = {
  session: SessionPayload | null;
  displayName?: string;
};

export function Header({ session, displayName }: HeaderProps) {
  const router = useRouter();
  const timer = useQuestStore((s) => s.timer);
  const teamState = useQuestStore((s) =>
    session?.role === "team" ? s.teams[session.userId] : undefined,
  );

  const progressValue = useMemo(() => {
    if (!teamState) return 0;
    return Math.min(100, (teamState.completedSteps.length / TOTAL_QUEST_STEPS) * 100);
  }, [teamState]);

  const stepLabel = useMemo(() => {
    if (!teamState) return "";
    if (teamState.currentStep === 0) return "Подготовка";
    if (teamState.currentStep >= FINISHED_STEP) return "Финиш";
    return `Шаг ${teamState.currentStep} / ${TOTAL_QUEST_STEPS}`;
  }, [teamState]);

  const urgent = timer.status === "running" && timer.remainingMs <= 5 * 60 * 1000;

  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (!session) {
    return (
      <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4">
        <Link
          href="/login"
          className="font-display text-lg font-bold tracking-tight text-accent"
        >
          КВЕСТ
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      <Link
        href={session.role === "admin" ? "/admin" : "/dashboard"}
        className="shrink-0 font-display text-lg font-bold tracking-tight text-accent"
      >
        КВЕСТ
      </Link>

      {session.role === "team" && teamState ? (
        <div className="mx-auto flex min-w-0 max-w-md flex-1 flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stepLabel}</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>
      ) : (
        <div className="mx-auto hidden text-sm text-muted-foreground md:block">
          {displayName}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div
          className={`font-mono text-sm tabular-nums md:text-base ${
            urgent ? "animate-pulse text-destructive" : "text-foreground"
          }`}
        >
          {formatDuration(timer.remainingMs)}
        </div>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Выйти"
              onClick={() => void logout()}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Выйти</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
