import { TOTAL_QUEST_STEPS } from "@/lib/quest-config";

export type UserRole = "team" | "admin";

export type User = {
  id: string;
  name: string;
  password: string;
  role: UserRole;
};

export const USERS: User[] = [
  { id: "team1", name: "Команда 1", password: "t1passyfka", role: "team" },
  { id: "team2", name: "Команда 2", password: "t2passxcjz", role: "team" },
  { id: "team3", name: "Команда 3", password: "t3passzikv", role: "team" },
  { id: "team4", name: "Команда 4", password: "t4passbptw", role: "team" },
  { id: "team5", name: "Команда 5", password: "t5passfrqu", role: "team" },
  { id: "team6", name: "Команда 6", password: "t6passujyl", role: "team" },
  { id: "team7", name: "Команда 7", password: "t7passytkr", role: "team" },
  { id: "admin", name: "Администратор", password: "admin2025-2026", role: "admin" },
];

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
    title: "Задание 4: Школьная викторина",
    description:
      "Ответьте на 12 вопросов о школе. Следующий вопрос откроется только после правильного ответа.",
    component: "schoolQuiz",
  },
  {
    id: 5,
    phase: "puzzle",
    title: "Задание 5: Скрытые кодовые слова",
    description:
      "По школе спрятаны конверты с буквами. Найдите все конверты исложите буквы по порядку — получится кодовое слово. Введите его ниже.",
    component: "hiddenCode",
    meta: { codeWord: "САМОВОСПИТАНИЕ" },
  },
  {
    id: 6,
    phase: "puzzle",
    title: "Задание 6: Поиск на портале",
    description:
      "Найдите 2 слова на официальном портале школы https://school7.edu.kz/main?lang=ru и введите их через дефис (слово-слово).",
    component: "portalSearch",
    meta: {
      hint1:
        "Подсказка 1: 34 страница новостей школы — найдите пост с участием выпускницы Чуряк Полины, посчитайте 40-е слово (числа считаются за слова).",
      hint2:
        "Подсказка 2: В разделе финансирования школы за 2024 год — на какой гимнастический предмет было потрачено 54 900 тенге? Введите первое слово названия этого предмета.",
      answer: "команда-козел",
    },
  },
  {
    id: 7,
    phase: "puzzle",
    title: "Задание 7: Стоп-кадр",
    description:
      "Инсценируйте каждую сцену всей командой и сфотографируйте. Каждая фотография должна быть сделана в соответствующем месте школы. Прикрепите все 6 фото ниже.",
    component: "stopFrame",
  },
  {
    id: 8,
    phase: "puzzle",
    title: "Задание 8: Крокодил",
    description:
      "Покажите фразу жестами без слов и звуков. У вас 3 минуты на каждую карточку.",
    component: "crocodileTimer",
  },
  {
    id: 9,
    phase: "puzzle",
    title: "Задание 9: Свободная прогулка",
    description:
      "Расслабьтесь. Просто сделайте пару кругов по школе. У вас есть 10 минут.",
    component: "freeWalk",
    meta: { durationMinutes: 10 },
  },
  {
    id: 10,
    phase: "puzzle",
    title: "Задание 10: Маршрут с завязанными глазами",
    description:
      "Выберите одного человека и завяжите ему глаза, затем нажмите «Начать» для начала задания.",
    component: "blindfoldRoute",
    meta: { codeWord: "ЛОХ" },
  },
  {
    id: 11,
    phase: "puzzle",
    title: "Задание 11: Ящик с кодовым замком",
    description:
      "В кабинете №20 стоит ящик, закрытый на кодовый замок. Рядом лежит конверт с загадками — каждая загадка даёт одну цифру кода. Разгадайте все загадки, откройте замок, внутри найдёте кодовое слово. Загадки находятся в конверте у наблюдателя в кабинете №20.",
    component: "ropeLock",
    meta: { codeWord: "школа" },
  },
  {
    id: 12,
    phase: "final",
    title: "Задание 12: Обвинения ИИ",
    description:
      "ИИ выдвигает обвинения против вашего класса. Опровергните каждое — напишите ответ и приложите фото-доказательство.",
    component: "aiAccusations",
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
  if (stepId >= 4 && stepId <= 11) return "ЗАГАДКИ";
  return "ФИНАЛЬНЫЙ БОСС";
}
