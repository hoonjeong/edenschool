import { getSession } from '@/lib/session';

export async function Navbar() {
  const session = await getSession();
  const user = session.user;

  return (
    <>
      <nav className="eden-navbar">
        <div className="eden-navbar-inner">
          <a href="/" className="eden-navbar-brand">
            <img src="/assets/img/logo.jpg" alt="이든배움" />
            <span>이든배움국어학원</span>
          </a>

          <ul className="eden-navbar-menu">
            <li><a href="/">학원소개</a></li>
            <li><a href="/class-info">수업안내</a></li>
            <li><a href="/board">게시판</a></li>
            <li><a href="/lecture">동영상강의</a></li>
            <li><a href="https://booking.naver.com/booking/13/bizes/844951">상담예약</a></li>
            <li><a href="/class-video">수업 소개영상</a></li>
            <li><a href="https://youtu.be/x0a4QVIBw28?si=lXpeHeJbYbFB06dV">수강후기</a></li>
            <li><a href="https://blog.naver.com/edenschool/223955303630">교습비</a></li>
          </ul>

          <div className="eden-navbar-right">
            {user ? (
              <>
                {user.code === 'O' && (
                  <div className="eden-dropdown">
                    <button className="eden-dropdown-toggle">관리자</button>
                    <div className="eden-dropdown-menu">
                      <a href="/admin/insert-lecture">동영상 강의추가</a>
                      <a href="/admin/lecture-info">동영상 관리</a>
                      <a href="/admin/new-student">학생 추가</a>
                      <a href="/admin/student-list">학생 관리</a>
                      <a href="/admin/exit-student-list">퇴원생 관리</a>
                      <a href="/admin/send-sms">문자보내기</a>
                    </div>
                  </div>
                )}
                {(user.code === 'T' || user.code === 'O') && (
                  <div className="eden-dropdown">
                    <button className="eden-dropdown-toggle">선생님</button>
                    <div className="eden-dropdown-menu">
                      <a href="/admin/teacher-lecture">동영상보기</a>
                    </div>
                  </div>
                )}
                <a href="/myinfo"><i className="fas fa-users-cog"></i> 내정보</a>
                <form action="/logout" method="post" style={{ display: 'inline', margin: 0 }}>
                  <button type="submit"><i className="fas fa-sign-out-alt"></i> 로그아웃</button>
                </form>
              </>
            ) : (
              <>
                <a href="/login"><i className="fas fa-sign-in-alt"></i> 로그인</a>
                <a href="/join">회원가입</a>
              </>
            )}
          </div>

          <button
            className="eden-navbar-toggle"
            type="button"
            data-toggle="eden-mobile"
            aria-label="메뉴"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className="eden-mobile-menu" id="edenMobileMenu">
        <a href="/">학원소개</a>
        <a href="/class-info">수업안내</a>
        <a href="/board">게시판</a>
        <a href="/lecture">동영상강의</a>
        <a href="https://booking.naver.com/booking/13/bizes/844951">상담예약</a>
        <a href="/class-video">수업 소개영상</a>
        <a href="https://youtu.be/x0a4QVIBw28?si=lXpeHeJbYbFB06dV">수강후기</a>
        <a href="https://blog.naver.com/edenschool/223955303630">교습비</a>
        <div className="eden-mobile-divider"></div>
        {user ? (
          <>
            {user.code === 'O' && (
              <>
                <a href="/admin/insert-lecture"><i className="fas fa-plus"></i> 동영상 강의추가</a>
                <a href="/admin/lecture-info"><i className="fas fa-list"></i> 동영상 관리</a>
                <a href="/admin/new-student"><i className="fas fa-user-plus"></i> 학생 추가</a>
                <a href="/admin/student-list"><i className="fas fa-users"></i> 학생 관리</a>
                <a href="/admin/exit-student-list"><i className="fas fa-user-slash"></i> 퇴원생 관리</a>
                <a href="/admin/send-sms"><i className="fas fa-sms"></i> 문자보내기</a>
              </>
            )}
            {(user.code === 'T' || user.code === 'O') && (
              <a href="/admin/teacher-lecture"><i className="fas fa-video"></i> 동영상보기</a>
            )}
            <div className="eden-mobile-divider"></div>
            <a href="/myinfo"><i className="fas fa-users-cog"></i> 내정보</a>
            <form action="/logout" method="post">
              <button type="submit"><i className="fas fa-sign-out-alt"></i> 로그아웃</button>
            </form>
          </>
        ) : (
          <>
            <a href="/login"><i className="fas fa-sign-in-alt"></i> 로그인</a>
            <a href="/join">회원가입</a>
          </>
        )}
      </div>
    </>
  );
}
