"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answersMatch } from "@/lib/quest-config";

type CodeWordInputProps = {
  label?: string;
  placeholder?: string;
  answer: string;
  onCorrect: () => void;
  buttonLabel?: string;
};

export function CodeWordInput({
  label = "Кодовое слово",
  placeholder = "Введите кодовое слово",
  answer,
  onCorrect,
  buttonLabel = "Проверить",
}: CodeWordInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    if (answersMatch(value, answer)) {
      setError(false);
      onCorrect();
    } else {
      setError(true);
    }
  }

  return (
    <div className="space-y-3">
      {label ? (
        <p className="text-sm font-medium text-foreground">{label}</p>
      ) : null}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      {error ? (
        <p className="text-sm text-destructive">Неверный ответ</p>
      ) : null}
      <Button type="button" className="w-full" onClick={submit}>
        {buttonLabel}
      </Button>
    </div>
  );
}
