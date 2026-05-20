"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/TaskCard";
import { ApprovalWaiting } from "@/components/tasks/ApprovalWaiting";
import { fileToCompressedDataUrl } from "@/lib/image-utils";
import { AI_ACCUSATIONS } from "@/lib/quest-config";
import { submitApproval } from "@/lib/quest-api";
import { useQuestStore } from "@/lib/store";

type AIAccusationsTaskProps = {
	title: string;
	description: string;
	teamId: string;
	step: number;
};

export function AIAccusationsTask({
	title,
	description,
	teamId,
	step,
}: AIAccusationsTaskProps) {
	const approvalPending = useQuestStore(
		(s) => s.teams[teamId]?.approvalPendingStep === step,
	);
	const [visibleCount, setVisibleCount] = useState(1);
	const [error, setError] = useState<string | null>(null);
	const [rebuttals, setRebuttals] = useState<string[]>(
		Array(AI_ACCUSATIONS.length).fill(""),
	);
	const [photos, setPhotos] = useState<(File | null)[]>(
		Array(AI_ACCUSATIONS.length).fill(null),
	);
	const [submitted, setSubmitted] = useState(false);
	const [uploading, setUploading] = useState(false);

	if (approvalPending || submitted) {
		return (
			<TaskCard title={title} description={description} active>
				<ApprovalWaiting />
			</TaskCard>
		);
	}

	const allFilled =
		rebuttals.every((r) => r.trim()) && photos.every((p) => p != null);
	const currentIndex = visibleCount - 1;
	const accusation = AI_ACCUSATIONS[currentIndex];

	async function submit() {
		if (!allFilled) return;
		setUploading(true);
		setError(null);
		try {
			const items = await Promise.all(
				AI_ACCUSATIONS.map(async (text, i) => ({
					accusation: text,
					rebuttal: rebuttals[i]!.trim(),
					dataUrl: await fileToCompressedDataUrl(photos[i]!),
				})),
			);
			await submitApproval(step, { type: "aiAccusations", items });
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
			<div className='rounded-xl border bg-muted/40 p-3 font-mono text-xs text-muted-foreground'>
				Система ИИ
			</div>
			<Card className='border-destructive/20'>
				<CardContent className='space-y-4 p-6'>
					<p className='text-xs text-muted-foreground'>
						Обвинение {currentIndex + 1} из {AI_ACCUSATIONS.length}
					</p>
					<p className='text-sm leading-relaxed'>
						<span className='text-accent'>&gt; </span>
						{accusation}
					</p>
					<div className='space-y-2'>
						<Label htmlFor={`rebuttal-${currentIndex}`}>
							Ваше опровержение
						</Label>
						<Input
							id={`rebuttal-${currentIndex}`}
							value={rebuttals[currentIndex]}
							onChange={(e) => {
								const next = [...rebuttals];
								next[currentIndex] = e.target.value;
								setRebuttals(next);
							}}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor={`proof-${currentIndex}`}>
							Фото-доказательство
						</Label>
						<input
							id={`proof-${currentIndex}`}
							type='file'
							accept='image/*'
							capture='environment'
							className='block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-input file:bg-background file:px-3 file:py-2'
							onChange={(e) => {
								const file = e.target.files?.[0] ?? null;
								setPhotos((prev) => {
									const next = [...prev];
									next[currentIndex] = file;
									return next;
								});
							}}
						/>
					</div>
				</CardContent>
			</Card>
			{currentIndex < AI_ACCUSATIONS.length - 1 ? (
				<Button
					type='button'
					className='w-full'
					disabled={
						!rebuttals[currentIndex]?.trim() ||
						photos[currentIndex] == null
					}
					onClick={() => setVisibleCount((c) => c + 1)}
				>
					Следующее обвинение
				</Button>
			) : (
				<>
					{error ? (
						<p className="text-sm text-destructive">{error}</p>
					) : null}
					<Button
						type="button"
						className="w-full"
						disabled={!allFilled || uploading}
						onClick={() => void submit()}
					>
						{uploading ? "Отправка на сервер…" : "Отправить на проверку"}
					</Button>
				</>
			)}
		</TaskCard>
	);
}
