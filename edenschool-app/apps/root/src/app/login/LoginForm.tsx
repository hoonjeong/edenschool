'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginFormInner({ savedEmail }: { savedEmail: string }) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const referer = searchParams.get('referer') || '/';
  const [saveEmailChecked, setSaveEmailChecked] = useState(!!savedEmail);

  return (
    <div className="eden-auth-wrapper">
      <div className="eden-auth-box">
        <div className="eden-auth-header">
          <div className="auth-icon">
            <i className="fas fa-sign-in-alt"></i>
          </div>
          <h4>로그인</h4>
          <p>이든배움국어학원 학생 로그인</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            이메일 또는 비밀번호가 올바르지 않습니다.
          </div>
        )}

        <form action="/api/auth/login" method="POST">
          <input type="hidden" name="referer" value={referer} />
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="이메일을 입력하세요"
              required
              defaultValue={savedEmail}
            />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input type="password" name="pw" className="form-control" placeholder="비밀번호를 입력하세요" required />
          </div>
          <div className="eden-login-options">
            <label>
              <input
                type="checkbox"
                name="saveEmail"
                checked={saveEmailChecked}
                onChange={(e) => setSaveEmailChecked(e.target.checked)}
              />
              이메일 저장
            </label>
            <label>
              <input type="checkbox" name="autoLogin" />
              자동로그인
            </label>
          </div>
          <button type="submit" className="btn-auth">로그인</button>
        </form>

        <div className="auth-links">
          <a href="/find-email">이메일 찾기</a>
          <span className="divider">|</span>
          <a href="/find-pass">비밀번호 찾기</a>
          <span className="divider">|</span>
          <a href="/join">회원가입</a>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({ savedEmail }: { savedEmail: string }) {
  return (
    <Suspense fallback={<div className="eden-auth-wrapper"><div className="eden-auth-box" style={{ textAlign: 'center' }}>로딩중...</div></div>}>
      <LoginFormInner savedEmail={savedEmail} />
    </Suspense>
  );
}
