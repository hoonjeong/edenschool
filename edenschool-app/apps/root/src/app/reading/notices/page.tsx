import { prisma } from "@/lib/reading/prisma";
import NoticesClient from "./notices-client";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  const [templates, students, recentLogs, smsConfigured] = await Promise.all([
    prisma.noticeTemplate.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      select: { id: true, name: true, grade: true, class: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.smsLog.findMany({ orderBy: { sentAt: "desc" }, take: 10 }),
    Promise.resolve(!!(process.env.SMS_USER_ID && process.env.SMS_AUTH_KEY)),
  ]);

  return (
    <NoticesClient
      templates={templates.map((t) => ({ id: t.id, title: t.title, body: t.body, variables: t.variables }))}
      students={students.map((s) => ({ id: s.id, name: s.name, grade: s.grade, classId: s.class?.id ?? null, className: s.class?.name ?? null }))}
      recentLogs={recentLogs.map((l) => ({ id: l.id, phone: l.phone, type: l.type, success: l.success, sentAt: l.sentAt.toISOString() }))}
      smsConfigured={smsConfigured}
    />
  );
}
