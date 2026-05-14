"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { SessionPayload } from "@/lib/auth";
import { QR_LOOKUP } from "@/lib/data";
import { useQuestStore } from "@/lib/store";

type UnlockClientProps = {
  token: string;
};

export function UnlockClient({ token }: UnlockClientProps) {
  const router = useRouter();
  const unlockStep = useQuestStore((s) => s.unlockStep);

  const [session, setSession] = useState<SessionPayload | null | undefined>(
    undefined,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [successStep, setSuccessStep] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    void fetch("/api/session")
      .then((r) => r.json())
      .then((data: { session: SessionPayload | null }) => {
        setSession(data.session);
      })
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    const unsub = useQuestStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    if (useQuestStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (handled.current) return;
    if (session === undefined || !hydrated) return;

    if (!session || session.role !== "team") {
      setMessage("Войдите как команда, чтобы активировать QR-код.");
      handled.current = true;
      return;
    }

    const meta = QR_LOOKUP[token];
    if (!meta) {
      setMessage("Недействительный QR-код.");
      handled.current = true;
      return;
    }

    if (meta.teamId !== session.userId) {
      setMessage("Этот QR-код не для вашей команды.");
      handled.current = true;
      return;
    }

    const state = useQuestStore.getState().teams[session.userId];
    if (!state) {
      setMessage("Состояние команды недоступно.");
      handled.current = true;
      return;
    }

    if (meta.step !== state.currentStep + 1) {
      setMessage("Этот QR-код не для вашего текущего шага.");
      handled.current = true;
      return;
    }

    unlockStep(session.userId, meta.step);
    setSuccessStep(meta.step);
    window.setTimeout(() => {
      router.push(`/task/${meta.step}`);
    }, 1500);
    handled.current = true;
  }, [session, hydrated, token, unlockStep, router]);

  if (session === undefined || !hydrated) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  if (message) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="max-w-md text-lg text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="animate-unlock-pop flex flex-col items-center gap-4">
        <CheckCircle2 className="h-20 w-20 text-accent" aria-hidden />
        <p className="font-display text-3xl font-bold">
          Шаг {successStep} разблокирован!
        </p>
        <p className="text-sm text-muted-foreground">
          Перенаправляем к заданию…
        </p>
      </div>
    </div>
  );
}
