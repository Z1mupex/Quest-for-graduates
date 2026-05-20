"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TaskCard } from "@/components/TaskCard";
import { ApprovalWaiting } from "@/components/tasks/ApprovalWaiting";
import { submitApproval } from "@/lib/quest-api";
import { fileToCompressedDataUrl } from "@/lib/image-utils";
import { STOP_FRAME_SCENES } from "@/lib/quest-config";
import { useQuestStore } from "@/lib/store";

type StopFrameTaskProps = {
  title: string;
  description: string;
  teamId: string;
  step: number;
};

export function StopFrameTask({
  title,
  description,
  teamId,
  step,
}: StopFrameTaskProps) {
  const approvalPending = useQuestStore(
    (s) => s.teams[teamId]?.approvalPendingStep === step,
  );
  const [files, setFiles] = useState<(File | null)[]>(
    Array(STOP_FRAME_SCENES.length).fill(null),
  );
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allUploaded = files.every((f) => f != null);

  if (approvalPending || submitted) {
    return (
      <TaskCard title={title} description={description} active>
        <ApprovalWaiting />
      </TaskCard>
    );
  }

  async function submit() {
    if (!allUploaded) return;
    setUploading(true);
    setError(null);
    try {
      const photos = await Promise.all(
        STOP_FRAME_SCENES.map(async (scene, i) => {
          const file = files[i]!;
          const dataUrl = await fileToCompressedDataUrl(file);
          return { scene, dataUrl };
        }),
      );
      await submitApproval(step, { type: "stopFrame", photos });
      setSubmitted(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось отправить на сервер",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <TaskCard title={title} description={description} active>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {STOP_FRAME_SCENES.map((scene) => (
          <li key={scene}>{scene}</li>
        ))}
      </ul>
      <div className="space-y-4">
        {STOP_FRAME_SCENES.map((scene, i) => (
          <div key={scene} className="space-y-2">
            <Label htmlFor={`photo-${i}`}>{scene}</Label>
            <input
              id={`photo-${i}`}
              type="file"
              accept="image/*"
              capture="environment"
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-input file:bg-background file:px-3 file:py-2"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setFiles((prev) => {
                  const next = [...prev];
                  next[i] = file;
                  return next;
                });
              }}
            />
            {files[i] ? (
              <p className="text-xs text-accent">Фото прикреплено</p>
            ) : null}
          </div>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {allUploaded ? (
        <Button
          type="button"
          className="w-full"
          disabled={uploading}
          onClick={() => void submit()}
        >
          {uploading ? "Отправка на сервер…" : "Отправить на проверку"}
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Прикрепите все 6 фотографий
        </p>
      )}
    </TaskCard>
  );
}
