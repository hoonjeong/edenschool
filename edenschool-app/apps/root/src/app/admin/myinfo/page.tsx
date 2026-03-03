import { requireAdminSession } from '@/lib/admin-session';
import { selectAdminUserInfoById } from '@edenschool/common/queries/admin-user';
import MyInfoClient from './MyInfoClient';

export default async function MyInfoPage() {
  const session = await requireAdminSession();

  const info = await selectAdminUserInfoById(session.user!.id);
  if (!info) {
    return (
      <div>
        <div className="alert alert-danger">사용자 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return <MyInfoClient info={info} />;
}
