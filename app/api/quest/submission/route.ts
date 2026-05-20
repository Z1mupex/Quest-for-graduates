import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import {
  deleteSubmission,
  loadSubmission,
  mutateQuestState,
  readQuestState,
  saveSubmission,
} from "@/lib/server-quest-store";
import type { ApprovalSubmission } from "@/lib/quest-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const maxDuration = 60;

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ error: "teamId обязателен" }, { status: 400 });
  }

  const submission = await loadSubmission(teamId);
  if (!submission) {
    return NextResponse.json({ error: "Материалы не найдены" }, { status: 404 });
  }

  return NextResponse.json({ submission });
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "team") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  let body: { step?: number; submission?: ApprovalSubmission };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const { step, submission } = body;
  if (step == null || !submission) {
    return NextResponse.json({ error: "Нет данных отправки" }, { status: 400 });
  }

  const teamId = session.userId;
  const current = await readQuestState();
  const team = current.teams[teamId];
  if (!team || team.currentStep !== step) {
    return NextResponse.json(
      { error: "Это не ваше текущее задание" },
      { status: 400 },
    );
  }

  try {
    await saveSubmission(teamId, submission);
    const state = await mutateQuestState((s) => {
      const teamNow = s.teams[teamId] ?? team;
      return {
        ...s,
        teams: {
          ...s.teams,
          [teamId]: {
            ...teamNow,
            approvalPendingStep: step,
          },
        },
      };
    });
    return NextResponse.json(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка сохранения";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
