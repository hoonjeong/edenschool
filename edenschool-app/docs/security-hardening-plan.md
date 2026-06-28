# 1단계 보안 강화 구현 계획서

작성일: 2026-06-28 · 대상: edenschool-app · 범위: 운영 리스크가 큰 보안/무결성 항목

> 원칙: ① 무중단·점진 전환 ② 각 단계 롤백 가능 ③ 기존 SHA1/메모리 동작과 하위 호환 유지

작업 권장 순서: **1 → 4 → 5 → 2 → 6 → 3** (영향 작고 독립적인 것부터, FK/Redis는 사전 점검 필요해 뒤로).

---

## 1. 비밀번호 SHA1 → bcrypt 전환 (최우선)

### 목적
SHA1(고속·무솔트)을 bcrypt(cost 12)로 교체. **로그인 시 재해싱(rehash-on-login)** 방식이라 사용자 재설정 없이 점진 전환되고, 미로그인 계정도 기존 SHA1 검증이 계속 동작.

### DB 컬럼 (확장 불필요 — 확인 완료)
운영 DB의 `user_info.pw`, `admin_user_info.pw`가 **모두 VARCHAR(100)**으로 확인됨(2026-06-28). bcrypt 해시는 60자라 그대로 저장되므로 **컬럼 변경(마이그레이션) 불필요.** (초기 계획의 VARCHAR(40) 가정은 `password.ts`의 오래된 주석 기준이었고 실제 DB와 달랐음.)
- 운영 DB는 변경하지 않는다([[never-modify-production-db]]). bcrypt 전환은 코드 + env 플래그만으로 처리.

### 코드 변경
1. **`packages/common/src/password.ts`** — `hashPassword()`를 bcrypt로 교체, 재해싱 판별 헬퍼 추가
   ```ts
   export async function hashPassword(plain: string): Promise<string> {
     return bcrypt.hash(plain, BCRYPT_ROUNDS); // 기존 SHA1 라인 대체
   }
   // 레거시(SHA1 40-hex) 해시인지 판별 → 로그인 라우트에서 재해싱 트리거
   export function needsRehash(hash: string): boolean {
     return /^[a-f0-9]{40}$/i.test(hash);
   }
   ```
   `verifyPassword()`는 **그대로 유지**(bcrypt+SHA1 동시 지원)가 핵심 — 기존 계정 호환.

2. **학생 로그인** `apps/root/src/app/api/auth/login/route.ts:29` — 검증 성공 직후 재해싱
   ```ts
   if (needsRehash(user.pw)) {
     try { await updateUserInfoPw(user.id, await hashPassword(pw)); }
     catch (e) { console.error('rehash failed', e); } // 실패해도 로그인은 진행
   }
   ```
   import 추가: `needsRehash, hashPassword`, `updateUserInfoPw`(이미 `queries/user`에 존재).

3. **관리자 로그인** `apps/root/src/app/api/admin/auth/login/route.ts:27` — 동일 패턴, `updatePasswordById(user.id, ...)` 사용(`queries/admin-user:103`).

### 자동 전환 범위 (hashPassword 한 곳 수정으로 함께 전환)
- 신규 가입: `api/auth/join`, `api/admin/auth/join`
- 비번 변경: `api/user/change-pw`, `api/admin/user/change-pw`
- 비번 찾기: `api/auth/find-pass`, `api/admin/auth/find-pass`
- 모두 `hashPassword()`를 거치므로 추가 수정 불필요.

### 활성화 (env 플래그)
`PASSWORD_BCRYPT_ENABLED=true` 설정 시 bcrypt 활성화. 기본(false)은 기존 SHA1 유지. 컬럼이 VARCHAR(100)이라 DB 변경 없이 플래그만으로 전환 가능. 재배포 없이 토글/롤백.

### 검증
- 플래그 ON 후 신규 가입 → DB `pw`가 `$2`로 시작, 60자 확인
- 기존 SHA1 계정 로그인 → 성공 + DB값이 `$2…`로 갱신됨 확인
- 비번 틀림 → 실패 유지, 재해싱 안 됨 확인

### 롤백
- `PASSWORD_BCRYPT_ENABLED=false`로 되돌리면 즉시 SHA1 동작 복귀(재배포 불필요).
- 이미 bcrypt로 바뀐 계정도 `verifyPassword`가 계속 지원하므로 데이터 롤백 불필요.

### 리스크
- 동시 로그인 시 재해싱 UPDATE 중복 가능하나 멱등(최종 1개 유효), 무해.
- ⚠️ (참고) 만약 다른 환경의 `pw` 컬럼이 60자 미만이면 그 환경에서만 플래그 ON 시 잘림 발생 → 환경별 컬럼 길이 확인 권장. 현재 운영 DB는 100자로 안전.

---

## 2. 핵심 외래키 + ON DELETE 정책 추가

### 목적
JOIN으로만 유지되는 관계에 FK 제약을 걸어 고아 데이터 차단. (split-file은 이미 `ON DELETE CASCADE` 적용 — 동일 관례 확장)

### 선행 점검 (필수)
FK 추가 전 **기존 고아 데이터 정리** 필요(없으면 ALTER 실패). 우선순위 높은 관계부터:

| 자식 테이블 | 부모 | 권장 정책 | 고아 점검 쿼리 |
|---|---|---|---|
| `class_status.class_id` | `class_info.id` | CASCADE | `SELECT cs.* FROM class_status cs LEFT JOIN class_info c ON cs.class_id=c.id WHERE c.id IS NULL` |
| `class_status.student_id` | `student.id` | CASCADE | 동일 패턴 |
| `lecture.class_id` | `class_info.id` | SET NULL(특강 null 허용) | 동일 |
| `file_status.lecture_id` | `lecture.id` | CASCADE | 동일 |
| `lecture_progress.lecture_id` | `lecture.id` | CASCADE | 동일 |
| `qna_comment.qna_post_id` | `qna_post.id` | CASCADE | 동일 |
| `comment.post_id` | `post_info.id` | CASCADE | 동일 |

### 작업 절차
1. 전체 스키마 덤프로 컬럼 타입·엔진 확인(`SHOW CREATE TABLE`). **FK는 양쪽 컬럼 타입 일치 + InnoDB + 인덱스 필수.**
2. 관계별 고아 점검 쿼리 실행 → 결과를 보고 후 정리(삭제 or NULL 처리) 결정 (데이터 손실 가능, **사용자 확인 단계**).
3. `migrations/002-add-foreign-keys.sql` 작성, **관계 1~2개씩 분할 적용**(전체 일괄 금지 — 실패 격리).
   ```sql
   ALTER TABLE class_status
     ADD CONSTRAINT fk_cs_class FOREIGN KEY (class_id)
     REFERENCES class_info(id) ON DELETE CASCADE;
   ```

### 롤백
```sql
ALTER TABLE class_status DROP FOREIGN KEY fk_cs_class;
```
FK는 데이터 변경 없이 제약만 추가/삭제 → 롤백 안전. 단 고아 정리(삭제)는 비가역이므로 **정리 전 백업 필수**.

### 리스크
- ⚠️ FK 추가 후 애플리케이션의 수동 삭제 로직(`qna.ts` 등)과 CASCADE 중복 동작 → 코드 검토 필요(중복 삭제는 무해하나 정리 가능).
- ⚠️ 기존 데이터에 타입 불일치(예: `INT` vs `BIGINT`)면 ALTER 실패 → 1번 절차에서 선확인.

---

## 3. 휴대폰 인증 코드 저장소 Redis 전환

### 목적
현재 메모리 Map(`verification-store.ts`) → 서버 재시작 시 소실·다중 서버 비동기화·만료정리 지연. 외부 저장소로 이전.

### 설계 (인터페이스 추상화 — 핵심)
기존 함수 시그니처를 **그대로 유지**하고 백엔드만 교체. 개발 환경(Redis 없음)에서는 메모리 폴백:

```ts
// verification-store.ts → 내부를 driver로 분리
interface VerificationDriver {
  set(key, entry, ttlSec): Promise<void>;
  get(key): Promise<VerificationEntry | null>;
  delete(key): Promise<void>;
}
// REDIS_URL 있으면 RedisDriver, 없으면 MemoryDriver(기존 동작)
```
- ⚠️ 함수가 동기 → **비동기(Promise) 전환** 필요. 호출처(verify-phone, check-*-phone, find-pass 등 약 8개 라우트)에 `await` 추가.
- TTL은 Redis `EXPIRE`로 위임(5분), `attempts`는 `INCR`, 5회 시 `DEL` → 원자적 처리로 동시성 개선.

### 의존성/환경변수
- `ioredis` 추가(`apps/root`), `REDIS_URL` 환경변수 + `.env.example` 갱신.
- 운영 Redis 인프라 준비 필요(별도 협의 항목).

### 검증/롤백
- `REDIS_URL` 미설정 시 메모리 드라이버로 자동 동작 → 기존과 동일, 점진 도입 가능.
- 롤백: 환경변수 제거 또는 코드 revert.

### 리스크
- 동기→비동기 전환으로 호출처 누락 시 컴파일 에러로 조기 발견(타입 안전). 영향 라우트 전수 점검 필요.

---

## 4. 파일 업로드 MIME/매직바이트 검증

### 목적
현재 `upload-validation.ts`는 **확장자만** 검사 → 실행파일을 `.pdf`로 위장 가능. 실제 바이트 시그니처 검증 추가.

### 코드 변경 — `apps/root/src/lib/upload-validation.ts`
`validateUploadedFile`을 async로 바꾸고 매직바이트 확인:
```ts
const SIGNATURES: Record<string, number[][]> = {
  pdf:  [[0x25,0x50,0x44,0x46]],            // %PDF
  hwp:  [[0xD0,0xCF,0x11,0xE0]],            // OLE(CFB)
  hwpx: [[0x50,0x4B,0x03,0x04]],            // ZIP
  png:  [[0x89,0x50,0x4E,0x47]],
  jpg:  [[0xFF,0xD8,0xFF]],
  // docx/xlsx = ZIP(PK), gif/bmp/webp …
};
// File.arrayBuffer() 앞 8바이트 읽어 확장자군과 시그니처 매칭
```
- 확장자 검사(기존)는 유지하고 시그니처 검사를 **추가**(이중).
- ZIP 계열(hwpx/docx/xlsx)은 PK 시그니처 공유 → 확장자로 분기.
- 호출처(`api/admin/file/upload` 등)에서 `await` 추가.

### 검증/롤백
- 정상 파일 통과 / 확장자만 위조한 파일 거부 테스트.
- 순수 추가 로직이라 revert만으로 롤백.

### 리스크
- 일부 정상 HWP 변종 시그니처 차이 가능 → 허용 시그니처 목록을 실제 업로드 샘플로 보정.

---

## 5. 비밀번호 재설정 일회용 토큰

### 목적
현재 `find-pass`는 휴대폰 인증(`verified=true`) 후 곧바로 비번 변경 API 호출 가능 → 인증 상태 재사용/탈취 시 변경 가능. 일회용 토큰으로 1회·단시간 제한.

### 설계
- 휴대폰 인증 성공(`markVerified`) 시 **단일 사용 토큰**(랜덤 32바이트) 발급, 저장소(3번 완료 시 Redis, 아니면 메모리)에 5분 TTL로 보관.
- `find-pass`/`admin find-pass`는 `phone`+`verified` 대신 **토큰 검증**으로 변경, 사용 즉시 폐기(`deleteVerification`).
- 토큰은 verify 응답으로 1회 반환 → 클라이언트가 재설정 요청에 동봉.

### 코드 변경
- `verification-store.ts`(또는 3번 드라이버)에 토큰 발급/소비 함수 추가.
- `api/auth/verify-find-phone`, `api/admin/auth/verify-phone`(찾기 흐름): 응답에 토큰 포함.
- `api/auth/find-pass:19`, `api/admin/auth/find-pass`: 토큰 검사로 교체.
- 해당 재설정 폼(클라이언트): 토큰 보관·전송.

### 검증/롤백
- 토큰 1회 사용 후 재사용 시 거부 / 5분 경과 거부 확인.
- 롤백: 라우트 코드 revert(저장소 함수는 미사용 시 무해).

### 리스크
- 3번(Redis)과 결합 권장 — 다중 서버에서 메모리 토큰은 동기화 안 됨. 단일 서버면 메모리로 선도입 가능.

---

## 6. 관리자 감사 로그(Audit Log)

### 목적
관리자/선생님의 변경 작업(학생·반·강의·SMS·비번 등) 이력 기록 → 사고 추적·책임성. 이후 모든 기능에서 재사용.

### 설계
```sql
-- migrations/003-audit-log.sql
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT, actor_code VARCHAR(2),      -- admin_user_info.id / 'O','T'
  action VARCHAR(50),                        -- e.g. 'student.modify'
  target_type VARCHAR(50), target_id VARCHAR(50),
  detail JSON, ip VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_actor (actor_id), INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
- `packages/common/src/queries/audit.ts`에 `insertAuditLog()` 추가.
- `api-handler.ts` 또는 헬퍼로 **공통 기록 함수** 제공, 변경(POST/PUT/DELETE) 관리자 라우트에서 호출.
- 기록 실패가 본 작업을 막지 않도록 try/catch 격리.

### 적용 범위 (단계적)
- 1차: 비번 변경, 학생 퇴원/재가입, 반 삭제, 선생님 추가/삭제 (고위험)
- 2차: 나머지 변경 라우트.

### 검증/롤백
- 각 작업 후 `audit_log` 적재 확인. 롤백: 테이블 DROP + 호출부 revert(독립적).

### 리스크
- 낮음(신규 테이블·부가 기록). `detail`에 민감정보(평문 비번 등) **미기록** 주의.

---

## 공통 사항

### 마이그레이션 운영
- 현재 마이그레이션 러너 없음 → `edenschool-app/migrations/` 디렉토리 신설, 번호순 `.sql` 수동 적용 + 적용 이력 수기 관리.
- (선택) 추후 간단한 러너 스크립트(`scripts/migrate.ts`, tsx) 도입 검토.

### 배포 체크리스트 (항목 1 기준 — 컬럼 100자라 DB 변경 없음)
1. 코드 배포(password.ts + 로그인 2곳) — 플래그 OFF 상태라 기존 동작 그대로, 무위험
2. 준비되면 `PASSWORD_BCRYPT_ENABLED=true` 설정(재배포 불필요한 환경이면 env 갱신 후 재기동)
3. 신규/기존 계정 로그인 스모크 테스트
4. 며칠간 `pw LIKE '$2%'` 비율 모니터링(전환 진행 확인)
5. 문제 시 플래그 OFF로 즉시 롤백

### 권장 진행 단위
각 항목을 **독립 브랜치 + 독립 PR**로. 1·4·5는 코드 위주라 빠르게, 2·3은 인프라/데이터 점검 동반.
