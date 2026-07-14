import Link from "next/link";
import { prisma } from "@/lib/reading/prisma";
import { getSession } from "@/lib/reading/session";
import { Card, StatCard, Badge, EmptyState } from "@/components/reading/ui";
import { ClassRateChart } from "./dashboard-charts";
import { ATTENDANCE_STATUS } from "@/lib/reading/labels";
import { fmtDate, fmtTime, relativeDay } from "@/lib/reading/utils";
import {
  Users, CalendarCheck, Sparkles, MessageSquareText, ScanLine, ClipboardList,
  ArrowRight, TrendingUp, AlertTriangle, Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSession();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);

  const [enrolled, todayAtt, weekCorrections, upcomingCounsels, classes, students, monthAtt, recentObs] =
    await Promise.all([
      prisma.student.count({ where: { status: "ENROLLED" } }),
      prisma.attendance.findMany({
        where: { date: today },
        include: { student: { select: { id: true, name: true, grade: true, class: { select: { name: true } } } } },
        orderBy: { checkInAt: "desc" },
      }),
      prisma.correction.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.counsel.findMany({
        where: { nextDate: { gte: today } },
        include: { student: { select: { id: true, name: true } } },
        orderBy: { nextDate: "asc" },
        take: 5,
      }),
      prisma.class.findMany({ orderBy: { name: "asc" } }),
      prisma.student.findMany({ where: { status: "ENROLLED" }, select: { id: true, classId: true } }),
      prisma.attendance.findMany({ where: { date: { gte: monthAgo, lte: today } }, select: { studentId: true, status: true } }),
      prisma.observation.findMany({
        include: { student: { select: { id: true, name: true, grade: true } } },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

  const checkedIn = todayAtt.length;
  const notCheckedIn = enrolled - checkedIn;

  // 반별 30일 출석률
  const stuClass = new Map(students.map((s) => [s.id, s.classId]));
  const clsStat = new Map<number, { total: number; present: number }>();
  for (const a of monthAtt) {
    const cid = stuClass.get(a.studentId);
    if (cid == null) continue;
    const cur = clsStat.get(cid) ?? { total: 0, present: 0 };
    cur.total++;
    if (a.status !== "ABSENT") cur.present++;
    clsStat.set(cid, cur);
  }
  const chartData = classes.map((c) => {
    const st = clsStat.get(c.id);
    return { name: c.name.replace(/\s.*/, ""), rate: st && st.total ? Math.round((st.present / st.total) * 100) : 0, color: c.color };
  });

  const hour = now.getHours();
  const greet = hour < 12 ? "좋은 아침이에요" : hour < 18 ? "안녕하세요" : "오늘도 수고 많으셨어요";

  return (
    <div>
      {/* 인사 */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold">{greet}, {session?.name ?? "선생님"} 👋</h2>
        <p className="text-muted mt-1 text-sm">{fmtDate(today, true)} · 오늘의 학원 현황을 한눈에 확인하세요.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Link href="/reading/students"><StatCard label="재원생" value={`${enrolled}명`} sub="전체 재원 학생" tone="brand" icon={<Users className="size-5" />} /></Link>
        <Link href="/reading/attendance"><StatCard label="오늘 등원" value={`${checkedIn}명`} sub={`미등원 ${notCheckedIn}명`} tone="mint" icon={<CalendarCheck className="size-5" />} /></Link>
        <Link href="/reading/corrections"><StatCard label="이번 주 첨삭" value={`${weekCorrections}건`} sub="최근 7일" tone="sky" icon={<Sparkles className="size-5" />} /></Link>
        <Link href="/reading/counsels"><StatCard label="상담 예정" value={`${upcomingCounsels.length}건`} sub="다가오는 상담·액션" tone="amber" icon={<MessageSquareText className="size-5" />} /></Link>
      </div>

      {/* 빠른 실행 */}
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <QuickAction href="/reading/checkin" icon={<ScanLine className="size-5" />} title="등원 체크인" desc="태블릿 키패드 열기" tone="brand" />
        <QuickAction href="/reading/corrections/new" icon={<Sparkles className="size-5" />} title="AI 첨삭 시작" desc="답안 업로드 → 첨삭" tone="sky" />
        <QuickAction href="/reading/observations" icon={<ClipboardList className="size-5" />} title="관찰일지 작성" desc="루브릭 상/중/하 체크" tone="mint" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* 오늘 등원 현황 */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h3 className="font-bold text-[15px]">오늘 등원 현황</h3>
            <Link href="/reading/attendance" className="text-[13px] font-semibold text-brand-600 hover:underline inline-flex items-center gap-1">
              전체 보기 <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {todayAtt.length === 0 ? (
            <EmptyState icon={<CalendarCheck className="size-6" />} title="아직 등원한 학생이 없습니다" desc="체크인 화면에서 등원을 기록하세요." />
          ) : (
            <div className="divide-y divide-line/70 max-h-[360px] overflow-y-auto">
              {todayAtt.map((a) => {
                const st = ATTENDANCE_STATUS[a.status];
                return (
                  <Link key={a.id} href={`/reading/students/${a.student.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-canvas/60">
                    <div className="grid size-8 place-items-center rounded-full bg-brand-50 text-brand-700 text-[12px] font-bold">{a.student.name.slice(0, 2)}</div>
                    <span className="font-semibold text-sm">{a.student.name}</span>
                    <span className="text-[12px] text-faint">{a.student.grade}</span>
                    {a.student.class && <span className="text-[12px] text-faint hidden sm:inline">· {a.student.class.name}</span>}
                    <Badge tone={st.tone} className="ml-auto">{st.label}</Badge>
                    <span className="text-[12px] text-faint tabular-nums inline-flex items-center gap-1 w-14 justify-end"><Clock className="size-3" />{fmtTime(a.checkInAt)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* 상담 예정 */}
        <Card>
          <div className="px-5 py-4 border-b border-line">
            <h3 className="font-bold text-[15px]">다가오는 상담·액션</h3>
          </div>
          {upcomingCounsels.length === 0 ? (
            <EmptyState icon={<MessageSquareText className="size-6" />} title="예정된 상담이 없습니다" />
          ) : (
            <div className="divide-y divide-line/60">
              {upcomingCounsels.map((c) => (
                <Link key={c.id} href={`/reading/students/${c.student.id}`} className="block px-5 py-3 hover:bg-canvas/60">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{c.student.name}</span>
                    <Badge tone="brand" className="ml-auto">{relativeDay(c.nextDate!)}</Badge>
                  </div>
                  {c.nextAction && <p className="text-[12px] text-muted mt-1 line-clamp-2">{c.nextAction}</p>}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        {/* 반별 출석률 */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-brand-600" />
            <h3 className="font-bold text-[15px]">반별 출석률</h3>
            <span className="text-[12px] text-faint">최근 30일</span>
          </div>
          {chartData.length === 0 ? (
            <p className="text-[13px] text-faint py-8 text-center">반 데이터가 없습니다.</p>
          ) : (
            <ClassRateChart data={chartData} />
          )}
        </Card>

        {/* 최근 관찰 */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h3 className="font-bold text-[15px]">최근 관찰일지</h3>
            <Link href="/reading/observations" className="text-[13px] font-semibold text-brand-600 hover:underline">더보기</Link>
          </div>
          {recentObs.length === 0 ? (
            <EmptyState icon={<ClipboardList className="size-6" />} title="관찰일지가 없습니다" />
          ) : (
            <div className="divide-y divide-line/60">
              {recentObs.map((o) => (
                <Link key={o.id} href={`/reading/students/${o.student.id}`} className="flex items-center gap-2 px-5 py-3 hover:bg-canvas/60">
                  <span className="font-semibold text-sm">{o.student.name}</span>
                  <span className="text-[12px] text-faint">{o.student.grade}</span>
                  <Badge tone="brand" className="ml-auto">{o.round}회차</Badge>
                  <span className="text-[12px] text-faint">{fmtDate(o.date)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, desc, tone }: any) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    sky: "bg-sky-50 text-sky-500",
    mint: "bg-mint-50 text-mint-600",
  };
  return (
    <Link href={href}>
      <Card className="p-4 flex items-center gap-3 hover:border-brand-200 hover:shadow-[var(--shadow-pop)] transition-all">
        <div className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}>{icon}</div>
        <div>
          <div className="font-bold text-[14px]">{title}</div>
          <div className="text-[12px] text-faint">{desc}</div>
        </div>
        <ArrowRight className="size-4 text-faint ml-auto" />
      </Card>
    </Link>
  );
}
