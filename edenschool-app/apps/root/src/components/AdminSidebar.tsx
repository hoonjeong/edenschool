import { getAdminSession } from '@/lib/admin-session';

export async function AdminSidebar() {
  const session = await getAdminSession();
  const user = session.user;
  const isAdmin = user?.code === 'O';

  return (
    <aside className="admin-sidebar" id="adminSidebar">
      <a href="/admin" className="admin-sidebar-brand">
        <i className="fas fa-school"></i>
        <span>이든배움 관리자</span>
      </a>

      <nav className="admin-sidebar-nav">
        {/* 선생님 메뉴 (모두) */}
        <div className="admin-sidebar-section">선생님</div>
        <a href="/admin/student-manage" className="admin-sidebar-link">
          <i className="fas fa-users"></i> 학생관리
        </a>
        <a href="/admin/teacher-lecture" className="admin-sidebar-link">
          <i className="fas fa-video"></i> 내영상보기
        </a>

        {/* 기출문제 메뉴 (모두) */}
        <div className="admin-sidebar-section">기출문제</div>
        <a href="/admin/prev-test-dashboard?region=부천" className="admin-sidebar-link">
          <i className="fas fa-chart-bar"></i> 부천지역 기출
        </a>
        <a href="/admin/prev-test-dashboard?region=타지역" className="admin-sidebar-link">
          <i className="fas fa-chart-bar"></i> 타학교 기출
        </a>
        <a href="/admin/split-file-search" className="admin-sidebar-link">
          <i className="fas fa-search"></i> 쪼개기 파일검색
        </a>

        {isAdmin && (
          <>
            {/* 기출관리 */}
            <div className="admin-sidebar-section">기출관리</div>
            <a href="/admin/prev-test-add?region=부천" className="admin-sidebar-link">
              <i className="fas fa-plus-circle"></i> 부천지역 기출
            </a>
            <a href="/admin/prev-test-add?region=타지역" className="admin-sidebar-link">
              <i className="fas fa-plus-circle"></i> 타지역 기출
            </a>
            <a href="/admin/split-file-add" className="admin-sidebar-link">
              <i className="fas fa-plus-circle"></i> 쪼개기 파일
            </a>

            {/* 게시글 */}
            <div className="admin-sidebar-section">게시글</div>
            <a href="/admin/post-info" className="admin-sidebar-link">
              <i className="fas fa-list"></i> 글관리
            </a>
            <a href="/admin/write" className="admin-sidebar-link">
              <i className="fas fa-pen"></i> 글쓰기
            </a>

            {/* 강의 */}
            <div className="admin-sidebar-section">강의</div>
            <a href="/admin/insert-lecture" className="admin-sidebar-link">
              <i className="fas fa-plus"></i> 강의추가
            </a>
            <a href="/admin/lecture-info" className="admin-sidebar-link">
              <i className="fas fa-chalkboard-teacher"></i> 강의관리
            </a>

            {/* 수강반 */}
            <div className="admin-sidebar-section">수강반</div>
            <a href="/admin/new-class" className="admin-sidebar-link">
              <i className="fas fa-plus"></i> 수강반추가
            </a>
            <a href="/admin/class-manager" className="admin-sidebar-link">
              <i className="fas fa-cogs"></i> 수강반관리
            </a>

            {/* 학생 */}
            <div className="admin-sidebar-section">학생</div>
            <a href="/admin/new-student" className="admin-sidebar-link">
              <i className="fas fa-user-plus"></i> 학생추가
            </a>
            <a href="/admin/student-manage" className="admin-sidebar-link">
              <i className="fas fa-user-cog"></i> 학생관리
            </a>

            {/* 선생님 관리 */}
            <div className="admin-sidebar-section">선생님 관리</div>
            <a href="/admin/new-teacher" className="admin-sidebar-link">
              <i className="fas fa-user-plus"></i> 선생님 추가
            </a>
            <a href="/admin/teacher-manager" className="admin-sidebar-link">
              <i className="fas fa-user-cog"></i> 선생님 관리
            </a>

            {/* 홈페이지 관리 */}
            <div className="admin-sidebar-section">홈페이지 관리</div>
            <a href="/admin/site-popup" className="admin-sidebar-link">
              <i className="fas fa-window-restore"></i> 팝업관리
            </a>
            <a href="/admin/class-display" className="admin-sidebar-link">
              <i className="fas fa-th-large"></i> 수업안내 수정
            </a>

            {/* 기타 */}
            <div className="admin-sidebar-section">기타</div>
            <a href="/admin/send-sms" className="admin-sidebar-link">
              <i className="fas fa-sms"></i> 문자발송
            </a>
            <a href="/admin/statistics" className="admin-sidebar-link">
              <i className="fas fa-chart-pie"></i> 통계
            </a>
            <a href="/admin/lecture-view-log" className="admin-sidebar-link">
              <i className="fas fa-play-circle"></i> 영상 시청 기록
            </a>

            {/* 개발중 */}
            <div className="admin-sidebar-section">개발중</div>
            <span className="admin-sidebar-link disabled">
              <i className="fas fa-paint-brush"></i> 메인디자인
            </span>
          </>
        )}
      </nav>

      <div className="admin-sidebar-footer">
        {user ? (
          <>
            <div className="admin-sidebar-user">
              <i className="fas fa-user-circle"></i>
              <span>{user.name}</span>
            </div>
            <div className="admin-sidebar-footer-links">
              <a href="/admin/myinfo">내정보</a>
              <form action="/admin/logout" method="post" style={{ display: 'inline' }}>
                <button type="submit" className="btn-link-logout">로그아웃</button>
              </form>
            </div>
          </>
        ) : (
          <div className="admin-sidebar-footer-links">
            <a href="/admin/login">로그인</a>
            <a href="/admin/join">회원가입</a>
          </div>
        )}
      </div>
    </aside>
  );
}
