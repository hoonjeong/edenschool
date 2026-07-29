import { getAdminSession } from '@/lib/admin-session';
import AdminSidebarSection from './AdminSidebarSection';

export async function AdminSidebar() {
  const session = await getAdminSession();
  const user = session.user;
  const isAdmin = user?.code === 'O';
  // 독서교육원(R): 기존 선생님(T)/운영진(O) 메뉴는 노출하지 않음(전용 화면 별도 개발 예정)
  const isReading = user?.code === 'R';

  return (
    <aside className="admin-sidebar" id="adminSidebar">
      <a href="/admin" className="admin-sidebar-brand">
        <i className="fas fa-school"></i>
        <span>이든배움 관리자</span>
      </a>

      <nav className="admin-sidebar-nav">
        {isReading && (
          <AdminSidebarSection title="독서교육원">
            <span className="admin-sidebar-link disabled">
              <i className="fas fa-book-reader"></i> 준비중입니다
            </span>
          </AdminSidebarSection>
        )}

        {!isReading && (
        <>
        {/* 선생님 메뉴 (모두) — 원장 로그인 시 기본 접힘 */}
        <AdminSidebarSection title="선생님" defaultCollapsed={isAdmin}>
          <a href="/admin/student-manage" className="admin-sidebar-link">
            <i className="fas fa-users"></i> 학생관리
          </a>
          <a href="/admin/teacher-lecture" className="admin-sidebar-link">
            <i className="fas fa-video"></i> 내영상보기
          </a>
        </AdminSidebarSection>

        {/* 내신기출문제 메뉴 (모두) */}
        <AdminSidebarSection title="내신기출문제">
          <a href="/admin/prev-test-dashboard?region=부천" className="admin-sidebar-link">
            <i className="fas fa-chart-bar"></i> 부천지역 기출
          </a>
          <a href="/admin/prev-test-dashboard?region=타지역" className="admin-sidebar-link">
            <i className="fas fa-chart-bar"></i> 타학교 기출
          </a>
          <a href="/admin/split-file-search" className="admin-sidebar-link">
            <i className="fas fa-search"></i> 쪼개기 파일검색
          </a>
        </AdminSidebarSection>

        {/* 모의고사 기출문제 메뉴 (모두) */}
        <AdminSidebarSection title="모의고사 기출문제">
          <a href="/admin/mock-full-search" className="admin-sidebar-link">
            <i className="fas fa-file-alt"></i> 풀세트 모의고사
          </a>
          <a href="/admin/mock-section-search" className="admin-sidebar-link">
            <i className="fas fa-layer-group"></i> 영역별 모의고사
          </a>
        </AdminSidebarSection>

        {isAdmin && (
          <>
            {/* 강의 */}
            <AdminSidebarSection title="강의">
              <a href="/admin/insert-lecture" className="admin-sidebar-link">
                <i className="fas fa-plus"></i> 강의추가
              </a>
              <a href="/admin/lecture-info" className="admin-sidebar-link">
                <i className="fas fa-chalkboard-teacher"></i> 강의관리
              </a>
              <a href="/admin/lecture-view-log" className="admin-sidebar-link">
                <i className="fas fa-play-circle"></i> 영상 시청 기록
              </a>
            </AdminSidebarSection>

            {/* 게시글 */}
            <AdminSidebarSection title="게시글">
              <a href="/admin/post-info" className="admin-sidebar-link">
                <i className="fas fa-list"></i> 글관리
              </a>
              <a href="/admin/write" className="admin-sidebar-link">
                <i className="fas fa-pen"></i> 글쓰기
              </a>
            </AdminSidebarSection>

            {/* 학생 */}
            <AdminSidebarSection title="학생">
              <a href="/admin/new-student" className="admin-sidebar-link">
                <i className="fas fa-user-plus"></i> 학생추가
              </a>
              <a href="/admin/student-list" className="admin-sidebar-link">
                <i className="fas fa-user-cog"></i> 학생관리
              </a>
              <a href="/admin/exit-student-list" className="admin-sidebar-link">
                <i className="fas fa-user-slash"></i> 퇴원생 관리
              </a>
              <a href="/admin/send-sms" className="admin-sidebar-link">
                <i className="fas fa-sms"></i> 문자발송
              </a>
            </AdminSidebarSection>

            {/* 수강반 */}
            <AdminSidebarSection title="수강반">
              <a href="/admin/new-class" className="admin-sidebar-link">
                <i className="fas fa-plus"></i> 수강반추가
              </a>
              <a href="/admin/class-manager" className="admin-sidebar-link">
                <i className="fas fa-cogs"></i> 수강반관리
              </a>
            </AdminSidebarSection>

            {/* 홈페이지 관리 */}
            <AdminSidebarSection title="홈페이지 관리">
              <a href="/admin/site-popup" className="admin-sidebar-link">
                <i className="fas fa-window-restore"></i> 팝업관리
              </a>
              <a href="/admin/class-display" className="admin-sidebar-link">
                <i className="fas fa-th-large"></i> 수업안내 수정
              </a>
            </AdminSidebarSection>

            {/* 선생님 관리 */}
            <AdminSidebarSection title="선생님 관리">
              <a href="/admin/new-teacher" className="admin-sidebar-link">
                <i className="fas fa-user-plus"></i> 선생님 추가
              </a>
              <a href="/admin/teacher-manager" className="admin-sidebar-link">
                <i className="fas fa-user-cog"></i> 선생님 관리
              </a>
            </AdminSidebarSection>

            {/* 내신 기출관리 */}
            <AdminSidebarSection title="내신 기출관리">
              <a href="/admin/prev-test-add?region=부천" className="admin-sidebar-link">
                <i className="fas fa-plus-circle"></i> 부천지역 기출
              </a>
              <a href="/admin/prev-test-add?region=타지역" className="admin-sidebar-link">
                <i className="fas fa-plus-circle"></i> 타지역 기출
              </a>
              <a href="/admin/split-file-add" className="admin-sidebar-link">
                <i className="fas fa-plus-circle"></i> 쪼개기 파일
              </a>
            </AdminSidebarSection>

            {/* 모의고사 기출관리 */}
            <AdminSidebarSection title="모의고사 기출관리">
              <a href="/admin/mock-full-add" className="admin-sidebar-link">
                <i className="fas fa-plus-circle"></i> 풀세트 모의고사
              </a>
              <a href="/admin/mock-section-add" className="admin-sidebar-link">
                <i className="fas fa-plus-circle"></i> 영역별 모의고사
              </a>
            </AdminSidebarSection>

            {/* 개발중 */}
            <AdminSidebarSection title="개발중">
              <span className="admin-sidebar-link disabled">
                <i className="fas fa-paint-brush"></i> 메인디자인
              </span>
            </AdminSidebarSection>
          </>
        )}
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
