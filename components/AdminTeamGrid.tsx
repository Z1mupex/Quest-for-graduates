"use client";

import { useEffect, useState } from "react";
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
import { AdminApprovalDialog } from "@/components/AdminApprovalDialog";
import { USERS } from "@/lib/data";
import { fetchQuestState, fetchSubmission, patchQuest } from "@/lib/quest-api";
import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";
import type { ApprovalSubmission } from "@/lib/quest-types";
import { useQuestStore } from "@/lib/store";

export function AdminTeamGrid() {
  const teams = useQuestStore((s) => s.teams);
  const [confirmTeamId, setConfirmTeamId] = useState<string | null>(null);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [reviewTeamId, setReviewTeamId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<ApprovalSubmission | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [busy, setBusy] = useState(false);

  const teamUsers = USERS.filter((u) => u.role === "team");

  const reviewTeam = reviewTeamId
    ? teamUsers.find((u) => u.id === reviewTeamId)
    : undefined;
  const reviewState = reviewTeamId ? teams[reviewTeamId] : undefined;

  const activeTeam =
    confirmTeamId != null
      ? teamUsers.find((u) => u.id === confirmTeamId)
      : undefined;

  useEffect(() => {
    if (!reviewTeamId) {
      setSubmission(null);
      return;
    }
    setLoadingSubmission(true);
    void fetchSubmission(reviewTeamId)
      .then(setSubmission)
      .catch(() => setSubmission(null))
      .finally(() => setLoadingSubmission(false));
  }, [reviewTeamId]);

  function phaseForStep(step: number) {
    if (step === 0) return "Ожидание";
    if (step >= 1 && step <= 3) return "Бюрократия";
    if (step >= 4 && step <= 11) return "Загадки";
    return "Финал";
  }

  async function runPatch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await patchQuest(body);
      if (
        body.action === "resetTeam" ||
        body.action === "resetAllTeams"
      ) {
        await fetchQuestState();
      }
    } finally {
      setBusy(false);
    }
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
              <th className="px-4 py-3 font-medium">Проверка</th>
              <th className="px-4 py-3 font-medium">Сбросить</th>
            </tr>
          </thead>
          <tbody>
            {teamUsers.map((user) => {
              const state = teams[user.id];
              const step = state?.currentStep ?? 0;
              const completed = state?.completedSteps.length ?? 0;
              const penalty = state?.penaltyActive ?? false;
              const pending = state?.approvalPendingStep;
              const rowTint =
                step >= 9
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
                    {Math.min(step, TOTAL_QUEST_STEPS)} / {TOTAL_QUEST_STEPS}
                  </td>
                  <td className="px-4 py-3">{phaseForStep(step)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Progress value={(completed / TOTAL_QUEST_STEPS) * 100} />
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
                        disabled={busy}
                        onClick={() =>
                          void runPatch({
                            action: "clearPenalty",
                            teamId: user.id,
                          })
                        }
                      >
                        Снять штраф
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {pending ? (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => setReviewTeamId(user.id)}
                      >
                        Смотреть и подтвердить
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
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

      <Button
        type="button"
        variant="destructive"
        disabled={busy}
        onClick={() => setConfirmAllOpen(true)}
      >
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmTeamId(null)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (confirmTeamId) {
                  void runPatch({
                    action: "resetTeam",
                    teamId: confirmTeamId,
                  }).then(() => setConfirmTeamId(null));
                }
              }}
            >
              Сбросить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminApprovalDialog
        teamName={reviewTeam?.name ?? ""}
        step={reviewState?.approvalPendingStep ?? 0}
        submission={submission ?? undefined}
        loading={loadingSubmission}
        open={reviewTeamId != null}
        onOpenChange={(open) => {
          if (!open) setReviewTeamId(null);
        }}
        onApprove={() => {
          if (reviewTeamId) {
            void runPatch({
              action: "approvePending",
              teamId: reviewTeamId,
            }).then(() => setReviewTeamId(null));
          }
        }}
      />

      <Dialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <DialogContent aria-describedby="reset-all-desc">
          <DialogHeader>
            <DialogTitle>Сбросить все команды?</DialogTitle>
            <DialogDescription id="reset-all-desc">
              Прогресс всех команд будет обнулён. Это действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmAllOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                void runPatch({ action: "resetAllTeams" }).then(() =>
                  setConfirmAllOpen(false),
                );
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
