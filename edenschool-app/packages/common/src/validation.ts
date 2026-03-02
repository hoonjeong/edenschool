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

export function getMaskedEmail(email: string): string {
  const match = email.match(/^(\S+)@(\S+\.\S+)$/);
  if (!match) return email;
  const id = match[1];
  const domain = match[2];
  if (id.length < 3) {
    return '*'.repeat(id.length) + '@' + domain;
  } else if (id.length === 3) {
    return id.slice(0, 1) + '**@' + domain;
  } else {
    return id.slice(0, id.length - 3) + '***@' + domain;
  }
}
