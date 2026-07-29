import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import pool from '@/lib/lesson-material/db';
import { lessonMaterialConfig } from '@/lib/lesson-material/config';

/** DB 연결·모델 확인 (화면 상단 상태 표시용) */
export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();

  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    db: 'up',
    model: lessonMaterialConfig.model,
    effort: lessonMaterialConfig.effort,
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});
