"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/TaskCard";
import { CROCODILE_CARDS } from "@/lib/quest-config";

const CARD_SECONDS = 3 * 60;

type CrocodileTimerTaskProps = {
  title: string;
  description: string;
  onComplete: () => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CrocodileTimerTask({
  title,
  description,
  onComplete,
}: CrocodileTimerTaskProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(CARD_SECONDS);

  useEffect(() => {
    if (cardIndex >= CROCODILE_CARDS.length) return;
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [cardIndex, secondsLeft]);

  const phrase = CROCODILE_CARDS[cardIndex];

  function guessed() {
    if (cardIndex + 1 >= CROCODILE_CARDS.length) {
      onComplete();
    } else {
      setCardIndex((i) => i + 1);
      setSecondsLeft(CARD_SECONDS);
    }
  }

  if (cardIndex >= CROCODILE_CARDS.length) {
    return null;
  }

  return (
    <TaskCard title={title} description={description} active>
      <p className="text-xs text-muted-foreground">
        Карточка {cardIndex + 1} из {CROCODILE_CARDS.length}
      </p>
      <Card className="border-accent/30">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="font-mono text-2xl font-bold md:text-3xl">{phrase}</p>
          <p className="font-mono text-4xl tabular-nums text-accent">
            {formatTime(Math.max(0, secondsLeft))}
          </p>
          <p className="text-sm text-muted-foreground">
            Покажите фразу жестами без слов и звуков
          </p>
        </CardContent>
      </Card>
      <Button type="button" className="w-full" size="lg" onClick={guessed}>
        Угадали!
      </Button>
    </TaskCard>
  );
}
