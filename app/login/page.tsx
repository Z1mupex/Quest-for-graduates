"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { USERS } from "@/lib/data";

export default function LoginPage() {
	const router = useRouter();
	const [userId, setUserId] = useState<string>("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(false);

	async function submit() {
		setLoading(true);
		setError(false);
		const res = await fetch("/api/session", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, password }),
		});
		setLoading(false);
		if (!res.ok) {
			setError(true);
			return;
		}
		const user = USERS.find((u) => u.id === userId);
		router.push(user?.role === "admin" ? "/admin" : "/dashboard");
		router.refresh();
	}

	return (
		<div className='flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-16'>
			<Card className='w-full max-w-md border-accent/30 shadow-glow'>
				<CardHeader className='space-y-2 text-center'>
					<CardTitle className='font-display text-4xl font-black text-accent'>
						КВЕСТ 2026
					</CardTitle>
					<p className='text-sm text-muted-foreground'>
						Выпускной квест школы
					</p>
				</CardHeader>
				<CardContent className='space-y-6 p-8'>
					<div className='space-y-2'>
						<Label htmlFor='user'>Участник</Label>
						<Select
							value={userId}
							onValueChange={setUserId}
							aria-label='Выбор команды или администратора'
						>
							<SelectTrigger id='user'>
								<SelectValue placeholder='Выберите команду' />
							</SelectTrigger>
							<SelectContent>
								{USERS.filter((u) => u.role === "team").map(
									(u) => (
										<SelectItem key={u.id} value={u.id}>
											{u.name}
										</SelectItem>
									),
								)}
								<SelectItem value='admin'>
									Администратор
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='password'>Пароль</Label>
						<Input
							id='password'
							type='password'
							autoComplete='current-password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") void submit();
							}}
						/>
					</div>
					{error ? (
						<p className='text-sm text-destructive'>
							Неверный пароль. Попробуйте снова.
						</p>
					) : null}
					<Button
						type='button'
						className='w-full'
						disabled={!userId || loading}
						onClick={() => void submit()}
					>
						Войти
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
