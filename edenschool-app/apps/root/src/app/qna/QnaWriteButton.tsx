'use client';

export function QnaWriteButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const handleClick = () => {
    if (isLoggedIn) {
      window.location.href = '/qna/write';
    } else {
      alert('이든배움국어학원 학생만 작성 가능합니다. 관리자에게 문의해주세요.');
    }
  };

  return (
    <button type="button" className="eden-btn eden-btn-primary" onClick={handleClick}>
      <i className="fas fa-pen"></i> 글쓰기
    </button>
  );
}
