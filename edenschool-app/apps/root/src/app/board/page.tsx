import { selectPostInfoList } from '@edenschool/common/queries/post';
import { BoardList } from '@/components/BoardList';
import { BoardTabs } from '@/components/BoardTabs';
import { toBoardItem } from '@/lib/board';

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || 'N';
  const list = await selectPostInfoList('P', category);

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>게시판</h2>
      </div>

      <BoardTabs active={category} />

      <BoardList
        items={list.map((item) => toBoardItem(item, `/post-view?id=${item.id}`))}
      />
    </div>
  );
}
