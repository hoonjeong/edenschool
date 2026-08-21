import { prisma } from "@/lib/reading/prisma";
import { parseWeekdays, formatWeekdays } from "@/lib/reading/schedule";
import AttendanceClient from "./attendance-client";

export const dynamic = "force-dynamic";

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selDate = sp.date ? new Date(sp.date + "T00:00:00") : today;

  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [students, dayAtt, monthAtt] = await Promise.all([
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      include: { class: true },
      orderBy: [{ classId: "asc" }, { name: "asc" }],
    }),
    prisma.attendance.findMany({ where: { date: selDate } }),
    prisma.attendance.findMany({
      where: { date: { gte: monthAgo, lte: today } },
      select: { studentId: true, status: true },
    }),
  ]);

  const dayMap = new Map(dayAtt.map((a) => [a.studentId, a.status]));

  // 반별 30일 출석률
  const clsStat = new Map<number, { total: number; present: number }>();
  const stuAbsent = new Map<number, number>();
  const stuByClass = new Map<number | null, number[]>();
  for (const s of students) {
    const arr = stuByClass.get(s.classId) ?? [];
    arr.push(s.id);
    stuByClass.set(s.classId, arr);
  }
  const stuClassMap = new Map(students.map((s) => [s.id, s.classId]));
  for (const a of monthAtt) {
    const cid = stuClassMap.get(a.studentId);
    if (cid != null) {
      const cur = clsStat.get(cid) ?? { total: 0, present: 0 };
      cur.total++;
      if (a.status !== "ABSENT") cur.present++;
      clsStat.set(cid, cur);
    }
    if (a.status === "ABSENT") stuAbsent.set(a.studentId, (stuAbsent.get(a.studentId) ?? 0) + 1);
  }

  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });
  const classStats = classes.map((c) => {
    const st = clsStat.get(c.id);
    return {
      id: c.id,
      name: c.name,
      color: c.color,
      rate: st && st.total > 0 ? Math.round((st.present / st.total) * 100) : null,
      count: students.filter((s) => s.classId === c.id).length,
    };
  });

  // 결석 다수 학생(상담·공지 트리거)
  const absentAlerts = students
    .map((s) => ({ id: s.id, name: s.name, className: s.class?.name ?? null, absent: stuAbsent.get(s.id) ?? 0 }))
    .filter((s) => s.absent >= 3)
    .sort((a, b) => b.absent - a.absent);

  // 반 시간표 텍스트('월·목 15:00')에서 요일을 뽑아 선택한 날짜에 수업이 있는 반만 가려낸다.
  const dow = selDate.getDay();
  const classDays = new Map(classes.map((c) => [c.id, parseWeekdays(c.schedule)]));

  const rows = students.map((s) => {
    const days = s.classId != null ? classDays.get(s.classId) ?? [] : [];
    return {
      id: s.id,
      name: s.name,
      grade: s.grade,
      className: s.class?.name ?? null,
      classColor: s.class?.color ?? null,
      classSchedule: s.class?.schedule ?? null,
      // 시간표에서 요일을 읽어 낸 반인지 (반 미배정·시간표 미입력이면 false)
      scheduleKnown: days.length > 0,
      classDays: formatWeekdays(days),
      scheduled: days.includes(dow),
      status: dayMap.get(s.id) ?? null,
    };
  });

  return (
    <AttendanceClient
      dateStr={ymd(selDate)}
      isToday={ymd(selDate) === ymd(today)}
      rows={rows}
      classStats={classStats}
      absentAlerts={absentAlerts}
    />
  );
}
