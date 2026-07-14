import { getAdminSession } from "@/lib/admin-session";

// edenbooks 코드가 기대하는 세션 형태(원본 lib/session.ts 와 동일 시그니처)
export interface ReadingSession {
  uid: number;
  name: string;
  role: "ADMIN" | "TEACHER" | "CLINIC";
}

// edenschool admin 세션을 독서교육원 세션으로 브리지.
// 독서교육원(code='R') 관리자만 접근 가능하며, edenbooks 내부에서는 ADMIN 권한으로 취급한다.
export async function getSession(): Promise<ReadingSession | null> {
  const session = await getAdminSession();
  const user = session.user;
  if (!user || user.code !== "R") return null;
  return { uid: user.id, name: user.name, role: "ADMIN" };
}
