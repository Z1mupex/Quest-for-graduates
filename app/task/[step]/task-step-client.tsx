"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BureaucracyTask } from "@/components/tasks/BureaucracyTask";
import { CompassTask } from "@/components/tasks/CompassTask";
import { CrocodileTask } from "@/components/tasks/CrocodileTask";
import { FinalTask } from "@/components/tasks/FinalTask";
import { GeographyTask } from "@/components/tasks/GeographyTask";
import { SilentChallengeTask } from "@/components/tasks/SilentChallengeTask";
import { SocialEngineeringTask } from "@/components/tasks/SocialEngineeringTask";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStepById } from "@/lib/data";
import {
  getQuestPersistHasHydrated,
  subscribeHydration,
  useQuestStore,
} from "@/lib/store";

type TaskStepClientProps = {
  step: number;
  teamId: string;
};

export function TaskStepClient({ step, teamId }: TaskStepClientProps) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(getQuestPersistHasHydrated);
  const team = useQuestStore((s) => s.teams[teamId]);
  const completeStep = useQuestStore((s) => s.completeStep);

  const [doneBanner, setDoneBanner] = useState(false);

  const handleComplete = useCallback(() => {
    completeStep(teamId, step);
    if (step !== 9) {
      setDoneBanner(true);
    }
  }, [completeStep, teamId, step]);

  useEffect(() => {
    if (hydrated) return;
    const unsub = subscribeHydration(() => setHydrated(true));
    if (getQuestPersistHasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, [hydrated]);

  const stepData = useMemo(() => getStepById(step), [step]);

  if (!hydrated) {
    return (
      <p className="p-10 text-center text-muted-foreground">Загрузка…</p>
    );
  }

  if (!stepData || Number.isNaN(step) || step < 1 || step > 9) {
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

  if (team.currentStep === 10) {
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

  if (step !== team.currentStep) {
    const target = team.currentStep;
    return (
      <Card className="mx-auto mt-10 max-w-md border-destructive/30">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-lg font-medium">
            🚫 Это не ваш текущий шаг. Ваш шаг: {target}
          </p>
          <Button
            type="button"
            onClick={() => {
              if (target <= 0) {
                router.push("/dashboard");
              } else {
                router.push(`/task/${target}`);
              }
            }}
          >
            Перейти к моему заданию →
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (team.completedSteps.includes(step)) {
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-muted-foreground">
            Задание уже выполнено. Найдите QR-код для следующего шага.
          </p>
          <Button asChild variant="secondary">
            <Link href="/dashboard">На панель команды</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (doneBanner && step !== 9) {
    return (
      <Card className="mx-auto mt-10 max-w-md border-accent/40 shadow-glow">
        <CardContent className="space-y-4 p-8 text-center text-lg">
          <p>✅ Задание выполнено! Найдите следующий QR-код, чтобы продолжить.</p>
          <Button asChild>
            <Link href="/dashboard">Вернуться на панель</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  switch (stepData.component) {
    case "bureaucracy":
      return (
        <div className="mx-auto max-w-xl px-4 py-10">
          <BureaucracyTask
            title={stepData.title}
            description={stepData.description}
            answer={stepData.answer ?? ""}
            onComplete={handleComplete}
          />
        </div>
      );
    case "silentChallenge":
      return (
        <div className="mx-auto max-w-xl px-4 py-10">
          <SilentChallengeTask
            title={stepData.title}
            description={stepData.description}
            meta={stepData.meta}
            onComplete={handleComplete}
          />
        </div>
      );
    case "geography":
      return (
        <div className="mx-auto max-w-xl px-4 py-10">
          <GeographyTask
            title={stepData.title}
            description={stepData.description}
            meta={stepData.meta}
            onComplete={handleComplete}
          />
        </div>
      );
    case "socialEngineering":
      return (
        <div className="mx-auto max-w-xl px-4 py-10">
          <SocialEngineeringTask
            title={stepData.title}
            description={stepData.description}
            meta={stepData.meta}
            teamId={teamId}
            onComplete={handleComplete}
          />
        </div>
      );
    case "compass":
      return (
        <div className="mx-auto max-w-xl px-4 py-10">
          <CompassTask
            title={stepData.title}
            description={stepData.description}
            meta={stepData.meta}
            onComplete={handleComplete}
          />
        </div>
      );
    case "crocodile":
      return (
        <div className="mx-auto max-w-xl px-4 py-10">
          <CrocodileTask
            title={stepData.title}
            description={stepData.description}
            meta={stepData.meta}
            onComplete={handleComplete}
          />
        </div>
      );
    case "final":
      return (
        <div className="mx-auto max-w-xl px-4 py-10">
          <FinalTask
            title={stepData.title}
            description={stepData.description}
            meta={stepData.meta}
            teamId={teamId}
            onComplete={handleComplete}
          />
        </div>
      );
    default:
      return (
        <p className="p-10 text-center text-muted-foreground">
          Неизвестный тип задания.
        </p>
      );
  }
}
