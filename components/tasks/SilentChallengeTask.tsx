"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/TaskCard";

type Status = "idle" | "recording" | "passed" | "failed";

type SilentChallengeTaskProps = {
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  onComplete: () => void;
};

export function SilentChallengeTask({
  title,
  description,
  meta,
  onComplete,
}: SilentChallengeTaskProps) {
  const volumeThreshold = Number(meta?.volumeThreshold ?? 20);
  const durationSeconds = Number(meta?.durationSeconds ?? 5);

  const [status, setStatus] = useState<Status>("idle");
  const [volume, setVolume] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const cleanupAudio = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
  }, []);

  useEffect(() => () => cleanupAudio(), [cleanupAudio]);

  useEffect(() => {
    if (status !== "passed") return;
    const t = window.setTimeout(() => {
      onComplete();
    }, 900);
    return () => window.clearTimeout(t);
  }, [status, onComplete]);

  function loop() {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const vol = (avg / 255) * 100;
    setVolume(vol);
    if (vol > volumeThreshold) {
      cleanupAudio();
      setCountdown(null);
      setStatus("failed");
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      dataRef.current = data;

      setStatus("recording");
      setVolume(0);

      const countdownTotal = 5;
      const totalSeconds = countdownTotal + durationSeconds;
      let elapsed = 0;
      setCountdown(5);

      rafRef.current = requestAnimationFrame(loop);

      intervalRef.current = window.setInterval(() => {
        elapsed += 1;
        if (elapsed <= countdownTotal) {
          setCountdown(countdownTotal - elapsed + 1);
        } else {
          setCountdown(null);
        }
        if (elapsed >= totalSeconds) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          cleanupAudio();
          setVolume(0);
          setCountdown(null);
          setStatus("passed");
        }
      }, 1000);
    } catch {
      setMicError(
        "Нет доступа к микрофону. Разрешите доступ и обновите страницу.",
      );
    }
  }

  function retry() {
    setStatus("idle");
    setVolume(0);
    setCountdown(null);
  }

  const barColor =
    volume > volumeThreshold ? "bg-destructive" : "bg-accent";

  return (
    <TaskCard title={title} description={description} active>
      <div className="flex items-end justify-center gap-6">
        <div className="flex h-48 w-10 items-end justify-center overflow-hidden rounded-full border bg-muted p-1">
          <div
            className={`w-full rounded-full transition-[height] duration-[50ms] ease-linear ${barColor}`}
            style={{ height: `${Math.min(100, volume)}%` }}
          />
        </div>
        <div className="flex max-w-xs flex-col items-center gap-4 text-center text-sm text-muted-foreground">
          <p>Уровень: {volume.toFixed(0)}%</p>
          <p>Порог: {volumeThreshold}%</p>
        </div>
      </div>

      {micError ? <p className="text-sm text-destructive">{micError}</p> : null}

      {status === "idle" || status === "failed" ? (
        <div className="flex flex-col items-center gap-4">
          <Button
            type="button"
            size="lg"
            className="h-28 w-28 rounded-full text-base"
            onClick={() => void startRecording()}
          >
            Начать запись
          </Button>
          {status === "failed" ? (
            <Card className="w-full border-destructive/50">
              <CardContent className="space-y-3 p-6">
                <p className="text-center text-lg font-semibold text-destructive">
                  ПРОВАЛЕНО ✗ — говорите тише!
                </p>
                <Button type="button" variant="secondary" className="w-full" onClick={retry}>
                  Попробовать снова
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {status === "recording" && countdown !== null ? (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="font-display text-8xl font-black text-accent">
            {countdown}
          </div>
        </div>
      ) : null}

      {status === "passed" ? (
        <Card className="border-accent/40">
          <CardContent className="p-6 text-center text-xl font-semibold text-accent">
            ПРОЙДЕНО ✓
          </CardContent>
        </Card>
      ) : null}
    </TaskCard>
  );
}
