import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { TaskStepClient } from "./task-step-client";

type PageProps = {
  params: { step: string };
};

export default async function TaskStepPage({ params }: PageProps) {
  const session = await getServerSession();
  if (!session || session.role !== "team") {
    redirect("/login");
  }

  const step = Number.parseInt(params.step, 10);
  if (Number.isNaN(step)) {
    redirect("/dashboard");
  }

  return <TaskStepClient step={step} teamId={session.userId} />;
}
