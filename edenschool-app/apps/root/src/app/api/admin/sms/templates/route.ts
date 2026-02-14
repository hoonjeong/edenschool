import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import {
  selectTemplatesByTeacherId,
  insertTemplate,
  deleteTemplate,
} from '@edenschool/common/queries/sms-log';

// GET: Fetch all templates for the logged-in teacher
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const templates = await selectTemplatesByTeacherId(session.user.id);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ templates: [] }, { status: 500 });
  }
});

// POST: Create a new template
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const { title, content } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }
    const id = await insertTemplate(session.user.id, title, content);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create template' }, { status: 500 });
  }
});

// DELETE: Delete a template
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await deleteTemplate(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete template' }, { status: 500 });
  }
});
