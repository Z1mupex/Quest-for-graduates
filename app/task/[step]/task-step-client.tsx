"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BureaucracyTask } from "@/components/tasks/BureaucracyTask";
import { AIAccusationsTask } from "@/components/tasks/AIAccusationsTask";
import { BlindfoldRouteTask } from "@/components/tasks/BlindfoldRouteTask";
import { CrocodileTimerTask } from "@/components/tasks/CrocodileTimerTask";
import { FreeWalkTask } from "@/components/tasks/FreeWalkTask";
import { HiddenCodeTask } from "@/components/tasks/HiddenCodeTask";
import { PortalSearchTask } from "@/components/tasks/PortalSearchTask";
import { RopeLockTask } from "@/components/tasks/RopeLockTask";
import { SchoolQuizTask } from "@/components/tasks/SchoolQuizTask";
import { StopFrameTask } from "@/components/tasks/StopFrameTask";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStepById } from "@/lib/data";
import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";
import { patchQuest, QuestApiError } from "@/lib/quest-api";
import { useQuestStore } from "@/lib/store";

type TaskStepClientProps = {
  step: number;
  teamId: string;
};

const FINISHED_STEP = TOTAL_QUEST_STEPS + 1;

export function TaskStepClient({ step, teamId }: TaskStepClientProps) {
  const router = useRouter();
  const hydrated = useQuestStore((s) => s.hydrated);
  const team = useQuestStore((s) => s.teams[teamId]);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const handleComplete = useCallback(async () => {
    setCompleteError(null);
    try {
      const state = await patchQuest({ action: "completeStep", step });
      const updated = state.teams[teamId];
      const saved =
        updated != null &&
        (updated.completedSteps.includes(step) || updated.currentStep > step);

      if (!saved) {
        setCompleteError(
          "Прогресс не сохранился на сервере. Подождите пару секунд и нажмите снова.",
        );
        return;
      }

      if (step === TOTAL_QUEST_STEPS) {
        router.replace("/dashboard");
        return;
      }
      router.replace(`/task/${step + 1}`);
    } catch (e) {
      setCompleteError(
        e instanceof QuestApiError
          ? e.message
          : "Ошибка при сохранении шага",
      );
    }
  }, [step, teamId, router]);

  useEffect(() => {
    if (!hydrated || !team) return;
    if (team.currentStep === FINISHED_STEP) return;
    if (step < team.currentStep) {
      router.replace(`/task/${team.currentStep}`);
    }
  }, [hydrated, team, step, router]);

  const stepData = useMemo(() => getStepById(step), [step]);

  if (!hydrated) {
    return (
      <p className="p-10 text-center text-muted-foreground">Загрузка…</p>
    );
  }

  if (!stepData || Number.isNaN(step) || step < 1 || step > TOTAL_QUEST_STEPS) {
    return (
      <p className="p-10 text-center text-muted-foreground">
        Задание не найдено.
      </p>
    );
  }

  if (!team) {
    return (
      <p className="p-10 text-center text-muted-foreground">
        Состояние команды недоступно.
      </p>
    );
  }

  if (team.currentStep === FINISHED_STEP) {
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-lg font-semibold">Квест завершён!</p>
          <Button asChild>
            <Link href="/dashboard">На панель команды</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step > team.currentStep) {
    const target = team.currentStep;
    return (
      <Card className="mx-auto mt-10 max-w-md border-destructive/30">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-lg font-medium">
            🚫 Это не ваш текущий шаг. Ваш шаг: {target}
          </p>
          <Button
            type="button"
            onClick={() => router.push(`/task/${target}`)}
          >
            Перейти к моему заданию →
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step < team.currentStep) {
    return (
      <p className="p-10 text-center text-muted-foreground">Переход…</p>
    );
  }

  if (team.approvalPendingStep === step) {
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-muted-foreground">
            Ожидайте подтверждения организатора.
          </p>
          <Button asChild variant="secondary">
            <Link href="/dashboard">На панель команды</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (team.completedSteps.includes(step)) {
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-muted-foreground">Задание уже выполнено.</p>
          <Button asChild>
            <Link href={`/task/${team.currentStep}`}>
              Задание {team.currentStep} →
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const wrap = (node: React.ReactNode) => (
    <div className="mx-auto max-w-xl space-y-3 px-4 py-10">
      {completeError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {completeError}
        </p>
      ) : null}
      {node}
    </div>
  );

  switch (stepData.component) {
    case "bureaucracy":
      return wrap(
        <BureaucracyTask
          title={stepData.title}
          description={stepData.description}
          answer={stepData.answer ?? ""}
          onComplete={() => void handleComplete()}
        />,
      );
    case "schoolQuiz":
      return wrap(
        <SchoolQuizTask
          title={stepData.title}
          description={stepData.description}
          onComplete={() => void handleComplete()}
        />,
      );
    case "hiddenCode":
      return wrap(
        <HiddenCodeTask
          title={stepData.title}
          description={stepData.description}
          meta={stepData.meta}
          onComplete={() => void handleComplete()}
        />,
      );
    case "portalSearch":
      return wrap(
        <PortalSearchTask
          title={stepData.title}
          description={stepData.description}
          meta={stepData.meta}
          onComplete={() => void handleComplete()}
        />,
      );
    case "stopFrame":
      return wrap(
        <StopFrameTask
          title={stepData.title}
          description={stepData.description}
          teamId={teamId}
          step={step}
        />,
      );
    case "crocodileTimer":
      return wrap(
        <CrocodileTimerTask
          title={stepData.title}
          description={stepData.description}
          onComplete={() => void handleComplete()}
        />,
      );
    case "freeWalk":
      return wrap(
        <FreeWalkTask
          title={stepData.title}
          description={stepData.description}
          meta={stepData.meta}
          onComplete={() => void handleComplete()}
        />,
      );
    case "blindfoldRoute":
      return wrap(
        <BlindfoldRouteTask
          title={stepData.title}
          description={stepData.description}
          meta={stepData.meta}
          onComplete={() => void handleComplete()}
        />,
      );
    case "ropeLock":
      return wrap(
        <RopeLockTask
          title={stepData.title}
          description={stepData.description}
          meta={stepData.meta}
          onComplete={() => void handleComplete()}
        />,
      );
    case "aiAccusations":
      return wrap(
        <AIAccusationsTask
          title={stepData.title}
          description={stepData.description}
          teamId={teamId}
          step={step}
        />,
      );
    default:
      return (
        <p className="p-10 text-center text-muted-foreground">
          Неизвестный тип задания.
        </p>
      );
  }
}
