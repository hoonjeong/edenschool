/**
 * URL 파라미터(쿼리스트링·동적 세그먼트·JSON 바디)를 DB ID 로 안전하게 변환한다.
 *
 * Number('undefined') 는 NaN 이고, mysql2 는 이를 `WHERE id=NaN` 으로 그대로 내보내
 * MySQL 에러(=500)를 낸다. 링크가 잘못 만들어졌을 때 원인이 드러나지 않고
 * "Application error" 만 남는 원인이었다.
 *
 * 잘못된 값은 null 로 돌려주므로, 호출부의 기존 `if (!id)` 가드가 그대로 걸린다.
 */
export function toId(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const s = String(value).trim();
  // 10진 정수 표기만 허용 — '1e3', '0x10', '1.5', '-1', ' 12 ' 같은 변형을 모두 배제한다.
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
