"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { USERS } from "@/lib/data";
import { useQuestStore } from "@/lib/store";
import { useState } from "react";

export function AdminTeamGrid() {
  const teams = useQuestStore((s) => s.teams);
  const resetTeam = useQuestStore((s) => s.resetTeam);
  const resetAllTeams = useQuestStore((s) => s.resetAllTeams);
  const clearPenalty = useQuestStore((s) => s.clearPenalty);
  const [confirmTeamId, setConfirmTeamId] = useState<string | null>(null);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);

  const teamUsers = USERS.filter((u) => u.role === "team");

  const activeTeam =
    confirmTeamId != null
      ? teamUsers.find((u) => u.id === confirmTeamId)
      : undefined;

  function phaseForStep(step: number) {
    if (step === 0) return "Ожидание";
    if (step >= 1 && step <= 3) return "Бюрократия";
    if (step >= 4 && step <= 8) return "Загадки";
    return "Финал";
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Шаг</th>
              <th className="px-4 py-3 font-medium">Фаза</th>
              <th className="px-4 py-3 font-medium">Прогресс</th>
              <th className="px-4 py-3 font-medium">Штраф</th>
              <th className="px-4 py-3 font-medium">Сбросить</th>
            </tr>
          </thead>
          <tbody>
            {teamUsers.map((user) => {
              const state = teams[user.id];
              const step = state?.currentStep ?? 0;
              const completed = state?.completedSteps.length ?? 0;
              const penalty = state?.penaltyActive ?? false;
              const rowTint =
                step >= 7
                  ? "bg-accent/5"
                  : step === 0
                    ? "bg-amber-500/5"
                    : "";

              return (
                <tr key={user.id} className={`border-t ${rowTint}`}>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      {user.name}
                      {penalty ? (
                        <Badge variant="destructive">ШТРАФ ⚠</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {Math.min(step, 9)} / 9
                  </td>
                  <td className="px-4 py-3">{phaseForStep(step)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Progress value={(completed / 9) * 100} />
                      <span className="text-xs text-muted-foreground">
                        Выполнено: {completed}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {penalty ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clearPenalty(user.id)}
                      >
                        Снять штраф
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfirmTeamId(user.id)}
                    >
                      Сбросить
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="destructive" onClick={() => setConfirmAllOpen(true)}>
        Сбросить все команды
      </Button>

      <Dialog
        open={confirmTeamId != null}
        onOpenChange={(open) => {
          if (!open) setConfirmTeamId(null);
        }}
      >
        <DialogContent aria-describedby="reset-team-desc">
          <DialogHeader>
            <DialogTitle>Сбросить команду?</DialogTitle>
            <DialogDescription id="reset-team-desc">
              Сбросить прогресс команды «{activeTeam?.name}»? Это действие
              необратимо.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="secondary" onClick={() => setConfirmTeamId(null)}>
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirmTeamId) resetTeam(confirmTeamId);
                setConfirmTeamId(null);
              }}
            >
              Сбросить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <DialogContent aria-describedby="reset-all-desc">
          <DialogHeader>
            <DialogTitle>Сбросить все команды?</DialogTitle>
            <DialogDescription id="reset-all-desc">
              Прогресс всех команд будет обнулён. Это действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="secondary" onClick={() => setConfirmAllOpen(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                resetAllTeams();
                setConfirmAllOpen(false);
              }}
            >
              Сбросить все
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
