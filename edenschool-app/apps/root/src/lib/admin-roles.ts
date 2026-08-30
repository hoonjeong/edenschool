// 관리자 계정 역할 코드(admin_user_info.code) 정의 — 폼/목록/사이드바 공용
// O=운영진(원장), T=선생님, R=독서교육원

export interface AdminRole {
  code: string;
  label: string;
}

export const ADMIN_ROLES: AdminRole[] = [
  { code: 'T', label: '선생님' },
  { code: 'O', label: '운영진' },
  { code: 'R', label: '독서교육원' },
];

// 선생님 관리 화면에서 표시·처리하는 역할 코드 목록
export const MANAGEABLE_ROLE_CODES = ADMIN_ROLES.map((r) => r.code); // ['T','O','R']

export function isManageableRole(code: unknown): code is string {
  return typeof code === 'string' && MANAGEABLE_ROLE_CODES.includes(code);
}

// 선생님 추가/수정 폼에서 새로 선택할 수 있는 역할(운영진 O 는 폼에서 부여하지 않음)
export const ASSIGNABLE_ROLES: AdminRole[] = ADMIN_ROLES.filter((r) => r.code !== 'O');

export function isAssignableRole(code: unknown): code is string {
  return typeof code === 'string' && ASSIGNABLE_ROLES.some((r) => r.code === code);
}

export function adminRoleLabel(code: string): string {
  return ADMIN_ROLES.find((r) => r.code === code)?.label ?? code;
}
