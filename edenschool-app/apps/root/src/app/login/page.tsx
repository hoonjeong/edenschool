'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const referer = searchParams.get('referer') || '/';

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <h3 className="text-center mb-4">로그인</h3>
      {error && (
        <div className="alert alert-danger">
          이메일 또는 비밀번호가 올바르지 않습니다.
        </div>
      )}
      <form action="/api/auth/login" method="POST">
        <input type="hidden" name="referer" value={referer} />
        <div className="form-group">
          <label>이메일</label>
          <input type="email" name="email" className="form-control" placeholder="이메일" required />
        </div>
        <div className="form-group">
          <label>비밀번호</label>
          <input type="password" name="pw" className="form-control" placeholder="비밀번호" required />
        </div>
        <button type="submit" className="btn btn-primary btn-block">로그인</button>
      </form>
      <div className="text-center mt-3">
        <a href="/find-email">이메일 찾기</a> | <a href="/find-pass">비밀번호 찾기</a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container text-center mt-5">로딩중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
