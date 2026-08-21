import { prisma } from "@/lib/reading/prisma";
import { toYmd } from "@/lib/reading/utils";
import MakeupClient from "./makeup-client";

export const dynamic = "force-dynamic";

// 보강 대기(결석) 목록을 훑는 기간
const PENDING_DAYS = 90;

export default async function MakeupPage({
  searchParams,
}: {
  // 출결 관리에서 '보강 등록'으로 넘어올 때 학생·결석일을 미리 채운다.
  searchParams: Promise<{ studentId?: string; absentDate?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const since = new Date(today);
  since.setDate(since.getDate() - PENDING_DAYS);

  const [makeups, students, classes, absences] = await Promise.all([
    prisma.makeupClass.findMany({
      include: {
        student: {
          select: { id: true, name: true, grade: true, class: { select: { name: true } } },
        },
      },
      orderBy: [{ makeupDate: "desc" }, { id: "desc" }],
      take: 500,
    }),
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      select: { id: true, name: true, grade: true, classId: true, class: { select: { name: true } } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // 최근 결석 — 보강 기록이 아직 없는 건이 '보강 대기'가 된다.
    prisma.attendance.findMany({
      where: { status: "ABSENT", date: { gte: since, lte: today } },
      include: {
        student: {
          select: { id: true, name: true, grade: true, status: true, class: { select: { name: true } } },
        },
      },
      orderBy: [{ date: "desc" }],
      take: 300,
    }),
  ]);

  // 보강 기록에 걸린 결석일의 출결 상태(= 보강 완료 여부)를 한 번에 읽는다.
  const key = (studentId: number, ymd: string) => `${studentId}|${ymd}`;
  const linkedIds = [...new Set(makeups.map((m) => m.studentId))];
  const linkedDates = [...new Set(makeups.map((m) => m.absentDate.getTime()))].map((t) => new Date(t));
  const linkedAtt = linkedIds.length
    ? await prisma.attendance.findMany({
        where: { studentId: { in: linkedIds }, date: { in: linkedDates } },
        select: { studentId: true, date: true, status: true },
      })
    : [];
  const attStatus = new Map(linkedAtt.map((a) => [key(a.studentId, toYmd(a.date)), a.status as string]));

  // 결석일 + 학생이 같은 보강 기록이 있으면 '대기'에서 뺀다.
  const hasMakeup = new Set(makeups.map((m) => key(m.studentId, toYmd(m.absentDate))));

  const rows = makeups.map((m) => {
    const absentYmd = toYmd(m.absentDate);
    return {
      id: m.id,
      studentId: m.studentId,
      studentName: m.student.name,
      grade: m.student.grade,
      className: m.student.class?.name ?? null,
      absentDate: absentYmd,
      makeupDate: toYmd(m.makeupDate),
      weekday: m.weekday,
      time: m.time,
      attended: m.attended,
      session: m.session,
      progress: m.progress,
      teacher: m.teacher,
      teacherNote: m.teacherNote,
      note: m.note,
      // 결석일 출결이 '보강'으로 바뀌어 있으면 완료된 보강
      done: attStatus.get(key(m.studentId, absentYmd)) === "MAKEUP",
    };
  });

  const pendingAbsences = absences
    .filter((a) => a.student.status === "ENROLLED")
    .map((a) => ({
      studentId: a.studentId,
      studentName: a.student.name,
      grade: a.student.grade,
      className: a.student.class?.name ?? null,
      absentDate: toYmd(a.date),
    }))
    .filter((a) => !hasMakeup.has(key(a.studentId, a.absentDate)));

  return (
    <MakeupClient
      makeups={rows}
      students={students.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        classId: s.classId,
        className: s.class?.name ?? null,
      }))}
      classes={classes}
      pendingAbsences={pendingAbsences}
      prefill={
        sp.studentId
          ? { studentId: Number(sp.studentId), absentDate: sp.absentDate ?? "" }
          : null
      }
    />
  );
}
