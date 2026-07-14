import "./globals.css";
import { Noto_Sans_KR } from "next/font/google";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import AppShell from "@/components/reading/AppShell";

const notoKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

// /reading 하위 전 페이지 동적 렌더링(빌드 시 DB 접속·프리렌더 방지)
export const dynamic = "force-dynamic";

// 독서교육원(code='R') 전용 세그먼트. 기존 선생님(T)/운영진(O)은 접근 불가.
export default async function ReadingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session.user) redirect("/admin/login");
  if (session.user.code !== "R") redirect("/admin");

  const user = { name: session.user.name, role: "ADMIN" };

  return (
    <div className={`${notoKr.className} reading-root`}>
      <AppShell user={user}>{children}</AppShell>
    </div>
  );
}
