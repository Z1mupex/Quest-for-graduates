"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuestStore } from "@/lib/store";
import type { SessionPayload } from "@/lib/auth";

type GlobalTimerOverlayProps = {
  session: SessionPayload | null;
};

export function GlobalTimerOverlay({ session }: GlobalTimerOverlayProps) {
  const status = useQuestStore((s) => s.timer.status);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status !== "finished") {
      setDismissed(false);
    }
  }, [status]);

  if (status !== "finished" || dismissed) {
    return null;
  }

  const isAdmin = session?.role === "admin";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="timer-overlay-title"
      aria-describedby="timer-overlay-desc"
    >
      <div className="max-w-md space-y-4 px-6 text-center">
        <h2
          id="timer-overlay-title"
          className="font-display text-4xl font-black tracking-tight md:text-5xl"
        >
          ⏰ ВРЕМЯ ВЫШЛО
        </h2>
        <p id="timer-overlay-desc" className="text-muted-foreground">
          Квест завершён.
        </p>
        {isAdmin ? (
          <Button type="button" onClick={() => setDismissed(true)}>
            Закрыть
          </Button>
        ) : null}
      </div>
    </div>
  );
}
