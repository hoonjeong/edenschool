// 선생님 근무 관(aca_part) 정의 — 선생님 추가/수정 폼과 API 공용
// part  : aca_part 테이블에 저장되는 관 번호
// phone : 해당 관에서 문자 발송 시 쓰이는 발신번호(aca_part.aca_phone)
//         발신번호는 알리고에 사전등록된 번호여야 실제 발송이 성공한다.

export interface AcaPart {
  part: number;
  label: string;
  phone: string;
}

export const ACA_PARTS: AcaPart[] = [
  { part: 1, label: '본관', phone: '010-9363-6362' },
  { part: 2, label: '2관', phone: '010-9363-6362' },
  { part: 3, label: '3관', phone: '010-9426-6362' },
  { part: 4, label: '교육원', phone: '010-5236-6362' },
  { part: 5, label: '5관', phone: '010-9103-6362' },
];

// 관리자 문자 발송 화면에서 고를 수 있는 발신번호 목록.
// 2관은 본관과 같은 번호(010-9363-6362)라 중복이라서 목록에서 뺀다.
export const SENDER_PARTS: AcaPart[] = ACA_PARTS.filter((p) => p.part !== 2);

// 발신번호를 고르지 않았을 때의 기본값 — 본관
export const DEFAULT_SENDER_PART = 1;

export function findAcaPart(part: unknown): AcaPart | undefined {
  const n = Number(part);
  return Number.isInteger(n) ? ACA_PARTS.find((p) => p.part === n) : undefined;
}

export function isValidAcaPart(part: unknown): boolean {
  return findAcaPart(part) !== undefined;
}

export function acaPartLabel(part: unknown): string {
  return findAcaPart(part)?.label ?? '미지정';
}
