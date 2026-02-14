import { NextRequest } from 'next/server';
import { serveFile } from '@/lib/file-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return serveFile(Number(id), 'image');
}
