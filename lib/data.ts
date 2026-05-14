export type UserRole = "team" | "admin";

export type User = {
  id: string;
  name: string;
  password: string;
  role: UserRole;
};

export const USERS: User[] = [
  { id: "team1", name: "Команда 1", password: "t1pass", role: "team" },
  { id: "team2", name: "Команда 2", password: "t2pass", role: "team" },
  { id: "team3", name: "Команда 3", password: "t3pass", role: "team" },
  { id: "team4", name: "Команда 4", password: "t4pass", role: "team" },
  { id: "team5", name: "Команда 5", password: "t5pass", role: "team" },
  { id: "team6", name: "Команда 6", password: "t6pass", role: "team" },
  { id: "team7", name: "Команда 7", password: "t7pass", role: "team" },
  { id: "admin", name: "Администратор", password: "admin2024", role: "admin" },
];

const TEAM_IDS = ["team1", "team2", "team3", "team4", "team5", "team6", "team7"] as const;

function tokenSuffix(teamIndex: number, step: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let x = (teamIndex + 1) * 104729 + step * 7919 + 49297;
  let s = "";
  for (let i = 0; i < 6; i++) {
    x = (x * 48271 + i * 9973) >>> 0;
    s += chars[x % chars.length];
  }
  return s;
}

export const QR_TOKEN_LIST: { token: string; teamId: string; step: number }[] = [];

for (let ti = 0; ti < TEAM_IDS.length; ti++) {
  const teamId = TEAM_IDS[ti];
  for (let step = 1; step <= 9; step++) {
    const token = `${teamId}-step${step}-${tokenSuffix(ti, step)}`;
    QR_TOKEN_LIST.push({ token, teamId, step: step });
  }
}

export const QR_LOOKUP: Record<string, { teamId: string; step: number }> =
  Object.fromEntries(
    QR_TOKEN_LIST.map((entry) => [entry.token, { teamId: entry.teamId, step: entry.step }]),
  );

export type StepPhase = "bureaucracy" | "puzzle" | "final";

export type QuestStep = {
  id: number;
  phase: StepPhase;
  title: string;
  description: string;
  answer?: string;
  component: string;
  meta?: Record<string, unknown>;
};

export const STEPS: QuestStep[] = [
  {
    id: 1,
    phase: "bureaucracy",
    title: "Задание 1: Бюрократический барьер 1",
    description:
      "Учитель сообщит вам секретное слово. Введите его ниже.",
    answer: "альфа",
    component: "bureaucracy",
  },
  {
    id: 2,
    phase: "bureaucracy",
    title: "Задание 2: Бюрократический барьер 2",
    description:
      "Учитель сообщит вам секретное слово. Введите его ниже.",
    answer: "браво",
    component: "bureaucracy",
  },
  {
    id: 3,
    phase: "bureaucracy",
    title: "Задание 3: Бюрократический барьер 3",
    description:
      "Учитель сообщит вам секретное слово. Введите его ниже.",
    answer: "чарли",
    component: "bureaucracy",
  },
  {
    id: 4,
    phase: "puzzle",
    title: "Задание 4: Схватка с ИИ",
    description:
      "ИИ считает, что 11 «Б» — самый шумный класс. Опровергните это. Произнесите девиз школы шёпотом всей командой. Уровень звука не должен превышать порог. Нажмите «Начать» и говорите тихо.",
    component: "silentChallenge",
    meta: {
      volumeThreshold: 20,
      durationSeconds: 5,
    },
  },
  {
    id: 5,
    phase: "puzzle",
    title: "Задание 5: Географический десант",
    description:
      "Координаты цели: Кабинет №214. Найдите объект, температура которого всегда 180°C. Чтобы получить подсказку — ответьте на вопрос по географии.",
    component: "geography",
    meta: {
      hintQuestion:
        "Какой тип климата по классификации Кёппена обозначается символом «Af»?",
      hintAnswer: "тропический влажный",
      hint:
        "Объект находится в кабинете технологии. Это утюг на гладильной доске.",
      finalAnswer: "утюг",
    },
  },
  {
    id: 6,
    phase: "puzzle",
    title: "Задание 6: Взлом соцсетей",
    description:
      "Найдите пост в официальном ВКонтакте школы от 1 сентября 2024 года. Третье слово в первом комментарии — ваш ключ. Введите его ниже.",
    component: "socialEngineering",
    meta: {
      correctAnswer: "знания",
      maxAttempts: 3,
    },
  },
  {
    id: 7,
    phase: "puzzle",
    title: "Задание 7: Географический азимут",
    description:
      "От главного входа пройдите 50 шагов на Север (0°), затем 15 шагов на Восток (90°). Там вас ждёт конверт. Внутри — схема с зашифрованным словом. Введите слово-пароль из конверта ниже.",
    component: "compass",
    meta: {
      answer: "ПОБЕДА",
    },
  },
  {
    id: 8,
    phase: "puzzle",
    title: "Задание 8: Цифровой Крокодил",
    description: "",
    component: "crocodile",
    meta: {
      word: "ПЕРЕМЕНА",
      confirmWord: "перемена",
    },
  },
  {
    id: 9,
    phase: "final",
    title: "Задание 9: Финальный замок",
    description:
      "Вы сделали это! Введите 4 кода с физических замков, чтобы завершить квест.",
    component: "final",
    meta: {
      codes: ["7К2М", "9Н4Р", "1Т8У", "3Ф6Х"],
    },
  },
];

export function getStepById(id: number): QuestStep | undefined {
  return STEPS.find((s) => s.id === id);
}

export function getUserById(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

export function validateCredentials(
  userId: string,
  password: string,
): User | null {
  const user = getUserById(userId);
  if (!user || user.password !== password) return null;
  return user;
}

export function getPhaseLabelForStep(stepId: number): string {
  if (stepId >= 1 && stepId <= 3) return "БЮРОКРАТИЯ";
  if (stepId >= 4 && stepId <= 8) return "ЗАГАДКИ";
  return "ФИНАЛЬНЫЙ БОСС";
}
