export const PASSWORD_RULES = '비밀번호는 영문, 숫자를 포함하여 8자 이상이어야 합니다.';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(pw: string): boolean {
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

export function isValidPhone(phone: string): boolean {
  const normalized = phone.replace(/-/g, '');
  return /^01[016789]\d{7,8}$/.test(normalized);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/-/g, '');
}
