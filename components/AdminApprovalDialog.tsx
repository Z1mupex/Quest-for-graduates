"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApprovalSubmission } from "@/lib/store";

type AdminApprovalDialogProps = {
  teamName: string;
  step: number;
  submission: ApprovalSubmission | undefined;
  loading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
};

export function AdminApprovalDialog({
  teamName,
  step,
  submission,
  loading = false,
  open,
  onOpenChange,
  onApprove,
}: AdminApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        aria-describedby="approval-review-desc"
      >
        <DialogHeader>
          <DialogTitle>
            Проверка: {teamName} — шаг {step}
          </DialogTitle>
          <DialogDescription id="approval-review-desc">
            Просмотрите материалы команды и подтвердите выполнение задания.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка материалов…</p>
        ) : !submission ? (
          <p className="text-sm text-muted-foreground">
            Материалы не найдены. Попросите команду отправить задание снова.
          </p>
        ) : submission.type === "stopFrame" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {submission.photos.map((photo) => (
              <figure key={photo.scene} className="space-y-2">
                <figcaption className="text-sm font-medium">
                  {photo.scene}
                </figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.dataUrl}
                  alt={photo.scene}
                  className="w-full rounded-lg border object-cover"
                />
              </figure>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {submission.items.map((item, i) => (
              <div
                key={`${i}-${item.accusation.slice(0, 20)}`}
                className="space-y-3 rounded-xl border p-4"
              >
                <p className="text-sm text-muted-foreground">{item.accusation}</p>
                <p className="text-sm">
                  <span className="font-medium">Опровержение: </span>
                  {item.rebuttal}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={`Доказательство ${i + 1}`}
                  className="max-h-64 w-full rounded-lg border object-contain"
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            type="button"
            disabled={loading || !submission}
            onClick={() => {
              onApprove();
              onOpenChange(false);
            }}
          >
            Подтвердить задание
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
