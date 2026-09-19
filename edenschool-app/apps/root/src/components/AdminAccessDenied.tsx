import Link from 'next/link';

// 운영진(code='O') 전용 페이지에 선생님(T)/독서교육원(R)이 URL로 직접 접근했을 때 보여주는 안내.
// 다른 화면으로 몰래 리다이렉트하지 않고 "권한 없음"을 명시적으로 알린다.
export function AdminAccessDenied() {
  return (
    <div>
      <div className="alert alert-danger" role="alert">
        <h5 className="alert-heading mb-2">
          <i className="fas fa-lock"></i> 접근 권한이 없습니다
        </h5>
        <p className="mb-0">이 메뉴는 운영진만 사용할 수 있습니다.</p>
      </div>
      <Link href="/admin" className="btn btn-outline-secondary btn-sm">
        관리자 홈으로
      </Link>
    </div>
  );
}
