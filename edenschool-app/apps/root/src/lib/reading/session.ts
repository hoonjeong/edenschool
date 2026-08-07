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

// 서버 액션·라우트 핸들러용 가드.
// /reading 세그먼트는 미들웨어가 막지만, 서버 액션은 페이지와 별개로 호출될 수 있으므로
// 데이터를 읽거나 바꾸는 액션마다 이 함수로 한 번 더 확인한다.
export async function requireSession(): Promise<ReadingSession> {
  const session = await getSession();
  if (!session) throw new Error("권한이 없습니다. 다시 로그인해 주세요.");
  return session;
}
