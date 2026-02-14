import { requireAdminSession } from '@/lib/admin-session';
import VariantQuestionClient from './VariantQuestionClient';

export default async function VariantQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; source?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const ids = params.ids?.split(',').map(Number).filter((n) => !isNaN(n)) || [];
  const source = (params.source === 'prev-test' || params.source === 'split-file')
    ? params.source
    : 'prev-test';

  return (
    <div>
      <h4 className="mb-3">변형문제 생성</h4>
      <VariantQuestionClient ids={ids} source={source} />
    </div>
  );
}
