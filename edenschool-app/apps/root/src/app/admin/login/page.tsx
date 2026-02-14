'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const referer = searchParams.get('referer') || '/admin';
  const error = searchParams.get('error');

  return (
    <div className="admin-auth-box">
      <div className="admin-auth-header">
        <div className="auth-icon">
          <i className="fas fa-school"></i>
        </div>
        <h4>이든배움 관리자</h4>
        <p>이든배움국어학원 선생님 전용 서비스입니다</p>
      </div>

      {error && (
        <div className="alert alert-danger">이메일 또는 비밀번호가 일치하지 않습니다.</div>
      )}

      <form action="/api/admin/auth/login" method="post">
        <div className="form-group">
          <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>이메일</label>
          <input
            name="email"
            type="email"
            placeholder="이메일을 입력하세요"
            autoComplete="on"
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>비밀번호</label>
          <input
            name="pw"
            type="password"
            placeholder="비밀번호를 입력하세요"
            className="form-control"
          />
        </div>
        <input type="hidden" name="referer" value={referer} />
        <div className="form-group" style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn-auth">로그인</button>
        </div>
      </form>

      <div className="auth-links">
        <a href="/admin/join">회원가입</a>
        <span className="divider">|</span>
        <a href="/admin/find-admin-email">이메일 찾기</a>
        <span className="divider">|</span>
        <a href="/admin/find-admin-pass">비밀번호 찾기</a>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="admin-auth-box">
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
