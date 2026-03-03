import { requireSession } from '@/lib/session';
import { QnaWriteForm } from './QnaWriteForm';

export default async function QnaWritePage() {
  await requireSession();
  return <QnaWriteForm />;
}
