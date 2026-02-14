import { getAdminSession } from '@/lib/admin-session';

export async function AdminNavbar() {
  const session = await getAdminSession();
  const user = session.user;

  return (
    <nav className="navbar navbar-expand-sm navbar-dark bg-danger">
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#collapsibleNavbar">
        <span className="p-2">MENU</span>
      </button>
      <div className="collapse navbar-collapse" id="collapsibleNavbar">
        <ul className="navbar-nav">
          <li className="nav-item active dropdown">
            <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown">선생님</a>
            <div className="dropdown-menu">
              <a className="dropdown-item" href="/admin/student-manage">학생관리</a>
              <a className="dropdown-item" href="/admin/teacher-lecture">내영상보기</a>
            </div>
          </li>
          <li className="nav-item active dropdown">
            <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown">기출문제</a>
            <div className="dropdown-menu">
              <a className="dropdown-item" href="/admin/prev-test-dashboard?region=부천">부천지역기출</a>
              <a className="dropdown-item" href="/admin/prev-test-dashboard?region=타지역">타학교 기출</a>
              <a className="dropdown-item" href="/admin/split-file-search">쪼개기 파일검색</a>
            </div>
          </li>
          {user?.code === 'O' && (
            <>
              <li className="nav-item active dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown">기출관리</a>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="/admin/prev-test-add?region=부천">부천기출관리</a>
                  <a className="dropdown-item" href="/admin/prev-test-add?region=타지역">타지역 기출관리</a>
                  <a className="dropdown-item" href="/admin/split-file-add">쪼개기 파일 관리</a>
                </div>
              </li>
              <li className="nav-item active dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown">게시글</a>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="/admin/post-info">글관리</a>
                  <a className="dropdown-item" href="/admin/write">글쓰기</a>
                </div>
              </li>
              <li className="nav-item active dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown">강의</a>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="/admin/insert-lecture">강의추가</a>
                  <a className="dropdown-item" href="/admin/lecture-info">강의관리</a>
                </div>
              </li>
              <li className="nav-item active dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown">수강반</a>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="/admin/new-class">수강반추가</a>
                  <a className="dropdown-item" href="/admin/class-manager">수강반관리</a>
                </div>
              </li>
              <li className="nav-item active dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown">학생</a>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="/admin/new-student">학생추가</a>
                  <a className="dropdown-item" href="/admin/student-manage">학생관리</a>
                </div>
              </li>
              <li className="nav-item active">
                <a className="nav-link" href="/admin/send-sms">문자발송</a>
              </li>
              <li className="nav-item active">
                <a className="nav-link" href="/admin/statistics">통계</a>
              </li>
            </>
          )}
        </ul>
        <ul className="navbar-nav ml-auto">
          {user ? (
            <>
              <li className="nav-item active">
                <a className="nav-link" href="/admin/myinfo">내정보</a>
              </li>
              <li className="nav-item active">
                <a className="nav-link" href="/admin/logout">로그아웃</a>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item active">
                <a className="nav-link" href="/admin/login">로그인</a>
              </li>
              <li className="nav-item active">
                <a className="nav-link" href="/admin/join">회원가입</a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
