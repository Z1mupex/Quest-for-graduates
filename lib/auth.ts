import { cookies } from "next/headers";

export type SessionPayload = {
  userId: string;
  role: "team" | "admin";
};

const COOKIE_NAME = "quest_session";

export function parseSessionCookie(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as SessionPayload;
    if (
      parsed &&
      typeof parsed.userId === "string" &&
      (parsed.role === "team" || parsed.role === "admin")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return parseSessionCookie(value);
}

export { COOKIE_NAME };
