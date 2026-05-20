"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProgressDots } from "@/components/ProgressDots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPhaseLabelForStep, getUserById } from "@/lib/data";
import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";
import { useQuestStore } from "@/lib/store";

const FINISHED_STEP = TOTAL_QUEST_STEPS + 1;

type DashboardClientProps = {
  teamId: string;
};

function phaseBadge(currentStep: number) {
  if (currentStep >= FINISHED_STEP) return "ФИНИШ";
  return getPhaseLabelForStep(Math.min(currentStep, TOTAL_QUEST_STEPS));
}

export function DashboardClient({ teamId }: DashboardClientProps) {
  const router = useRouter();
  const hydrated = useQuestStore((s) => s.hydrated);
  const team = useQuestStore((s) => s.teams[teamId]);
  const user = getUserById(teamId);

  if (!hydrated || !team) {
    return (
      <div className="px-6 py-16 text-center text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  const activeTask =
    team.currentStep > 0 &&
    team.currentStep <= TOTAL_QUEST_STEPS &&
    !team.completedSteps.includes(team.currentStep) &&
    team.approvalPendingStep !== team.currentStep;

  const waitingApproval =
    team.approvalPendingStep != null &&
    team.approvalPendingStep === team.currentStep;

  const finished = team.currentStep === FINISHED_STEP;

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

      {!finished && waitingApproval ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <p className="text-muted-foreground">
              Задание {team.approvalPendingStep} отправлено на проверку.
              Ожидайте подтверждения организатора.
            </p>
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
