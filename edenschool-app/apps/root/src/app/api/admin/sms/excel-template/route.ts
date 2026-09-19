import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { buildSmsExcelTemplate } from '@/lib/sms-excel';

export const runtime = 'nodejs';

// GET: 「엑셀로 발송」 샘플 양식 다운로드
export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();
  const buf = await buildSmsExcelTemplate();
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sms_recipients_template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
});
