"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import Link from "next/link";
import { ProgressDots } from "@/components/ProgressDots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPhaseLabelForStep, getUserById } from "@/lib/data";
import {
  getQuestPersistHasHydrated,
  subscribeHydration,
  useQuestStore,
} from "@/lib/store";

type DashboardClientProps = {
  teamId: string;
};

function phaseBadge(currentStep: number) {
  if (currentStep === 0) return "БЮРОКРАТИЯ";
  if (currentStep >= 10) return "ФИНИШ";
  return getPhaseLabelForStep(Math.min(currentStep, 9));
}

export function DashboardClient({ teamId }: DashboardClientProps) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(getQuestPersistHasHydrated);
  const team = useQuestStore((s) => s.teams[teamId]);
  const user = getUserById(teamId);

  useEffect(() => {
    if (hydrated) return;
    const unsub = subscribeHydration(() => setHydrated(true));
    if (getQuestPersistHasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, [hydrated]);

  if (!hydrated || !team) {
    return (
      <div className="px-6 py-16 text-center text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  const activeTask =
    team.currentStep > 0 &&
    team.currentStep <= 9 &&
    !team.completedSteps.includes(team.currentStep);

  const waitingQr =
    team.currentStep === 0 ||
    (team.currentStep > 0 &&
      team.currentStep < 9 &&
      team.completedSteps.includes(team.currentStep));

  const finished = team.currentStep === 10;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div className="space-y-3 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Панель команды
        </p>
        <h1 className="font-display text-3xl font-bold md:text-4xl">
          Добро пожаловать, {user?.name ?? "команда"}!
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-xs uppercase tracking-wide">
            {phaseBadge(team.currentStep)}
          </Badge>
          {finished ? (
            <Badge variant="default">Квест завершён</Badge>
          ) : null}
        </div>
      </div>

      {finished ? (
        <Card className="border-accent/40 shadow-glow">
          <CardContent className="space-y-3 p-8 text-center text-lg">
            <p>Вы прошли все задания. Поздравляем с финишем!</p>
            <Button type="button" variant="secondary" onClick={() => router.refresh()}>
              Обновить статус
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!finished && activeTask ? (
        <Card className="border-accent/40 shadow-glow">
          <CardContent className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Текущее задание</p>
              <p className="font-display text-xl font-semibold">
                Шаг {team.currentStep}
              </p>
            </div>
            <Button asChild size="lg">
              <Link href={`/task/${team.currentStep}`}>
                Продолжить задание →
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!finished && waitingQr && !activeTask ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <QrCode className="h-12 w-12 text-accent" aria-hidden />
            <p className="max-w-md text-muted-foreground">
              Отсканируйте QR-код, чтобы разблокировать следующий шаг
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Прогресс</p>
        <ProgressDots
          currentStep={team.currentStep}
          completedSteps={team.completedSteps}
        />
      </div>
    </div>
  );
}
