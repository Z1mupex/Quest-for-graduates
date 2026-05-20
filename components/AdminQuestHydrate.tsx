"use client";

import { useLayoutEffect } from "react";
import type { QuestState } from "@/lib/quest-types";
import { useQuestStore } from "@/lib/store";

type AdminQuestHydrateProps = {
  initialState: QuestState;
};

/** Серверный снимок прогресса — админка не ждёт первого poll. */
export function AdminQuestHydrate({ initialState }: AdminQuestHydrateProps) {
  useLayoutEffect(() => {
    useQuestStore.getState().hydrateFromServer(initialState);
  }, [initialState]);

  return null;
}
