"use client";

import { Header } from "@/components/Header";
import { GlobalTimerOverlay } from "@/components/GlobalTimerOverlay";
import { TimerTicker } from "@/components/TimerTicker";
import type { SessionPayload } from "@/lib/auth";
import { getUserById } from "@/lib/data";

type AppChromeProps = {
  session: SessionPayload | null;
  children: React.ReactNode;
};

export function AppChrome({ session, children }: AppChromeProps) {
  const displayName = session
    ? getUserById(session.userId)?.name
    : undefined;

  return (
    <>
      <TimerTicker />
      <GlobalTimerOverlay session={session} />
      <Header session={session} displayName={displayName} />
      <main className="flex-1">{children}</main>
    </>
  );
}
