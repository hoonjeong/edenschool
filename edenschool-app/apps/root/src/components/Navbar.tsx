import { getSession } from '@/lib/session';

export async function Navbar() {
  const session = await getSession();
  const user = session.user;

  return (
    <>
      <nav className="navbar navbar-expand-sm navbar-dark bg-dark">
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#collapsibleNavbar">
          <span className="p-2">전체메뉴</span>
        </button>
        <div className="collapse navbar-collapse" id="collapsibleNavbar">
          <ul className="navbar-nav">
            <li className="nav-item active">
              <a className="nav-link" href="/">홈</a>
            </li>
            <li className="nav-item active">
              <a className="nav-link" href="/#high">고등부</a>
            </li>
            <li className="nav-item active">
              <a className="nav-link" href="/#middle">중등부</a>
            </li>
            <li className="nav-item active">
              <a className="nav-link" href="/board">게시판</a>
            </li>
            <li className="nav-item active">
              <a className="nav-link" href="/lecture">동영상강의</a>
            </li>
            <li className="nav-item active">
              <a className="nav-link" href="https://booking.naver.com/booking/13/bizes/844951">상담예약</a>
            </li>
            <li className="nav-item active">
              <a className="nav-link" href="https://youtu.be/x0a4QVIBw28?si=lXpeHeJbYbFB06dV">수강후기</a>
            </li>
            <li className="nav-item active">
              <a className="nav-link" href="https://blog.naver.com/edenschool/223955303630">교습비</a>
            </li>
          </ul>
          <ul className="navbar-nav ml-auto">
            {user ? (
              <>
                {user.code === 'O' && (
                  <li className="nav-item active dropdown">
                    <a className="nav-link dropdown-toggle" href="#" id="navbardrop" data-toggle="dropdown">관리자</a>
                    <div className="dropdown-menu">
                      <a className="dropdown-item" href="/admin-insert-lecture">동영상 강의추가</a>
                      <a className="dropdown-item" href="/admin-lecture-info">동영상 관리</a>
                      <a className="dropdown-item" href="/admin-new-student">학생 추가</a>
                      <a className="dropdown-item" href="/admin-class-info">학생 관리</a>
                      <a className="dropdown-item" href="/admin-send-sms">문자보내기</a>
                    </div>
                  </li>
                )}
                {(user.code === 'T' || user.code === 'O') && (
                  <li className="nav-item active dropdown">
                    <a className="nav-link dropdown-toggle" href="#" id="navbardrop2" data-toggle="dropdown">선생님</a>
                    <div className="dropdown-menu">
                      <a className="dropdown-item" href="">동영상보기</a>
                    </div>
                  </li>
                )}
                <li className="nav-item active">
                  <a className="nav-link" href="/myinfo"><i className="fas fa-users-cog"></i> 내정보</a>
                </li>
                <li className="nav-item active">
                  <a className="nav-link" href="/logout"><i className="fas fa-sign-out-alt"></i> 로그아웃</a>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item active">
                  <a className="nav-link" href="/login"><i className="fas fa-sign-in-alt"></i> 로그인</a>
                </li>
                <li className="nav-item active">
                  <a className="nav-link" href="/join">회원가입</a>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </>
  );
}
