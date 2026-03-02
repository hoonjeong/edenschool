interface VerificationEntry {
  code: string;
  phone: string;
  expiresAt: number;
  verified: boolean;
  attempts: number;
  /** User-side only: linked student ID */
  studentId?: number;
}

const store = new Map<string, VerificationEntry>();

// Cleanup expired entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.expiresAt) store.delete(key);
    }
  }, 60_000);
}

function makeKey(prefix: string, phone: string): string {
  return `${prefix}:${phone}`;
}

export function setVerification(
  prefix: string,
  phone: string,
  code: string,
  studentId?: number,
): void {
  store.set(makeKey(prefix, phone), {
    code,
    phone,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    verified: false,
    attempts: 0,
    studentId,
  });
}

export function getVerification(
  prefix: string,
  phone: string,
): VerificationEntry | null {
  const entry = store.get(makeKey(prefix, phone));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(makeKey(prefix, phone));
    return null;
  }
  return entry;
}

export function markVerified(prefix: string, phone: string): void {
  const entry = store.get(makeKey(prefix, phone));
  if (entry) entry.verified = true;
}

export function incrementAttempts(prefix: string, phone: string): number {
  const entry = store.get(makeKey(prefix, phone));
  if (!entry) return 0;
  entry.attempts += 1;
  if (entry.attempts >= 5) {
    store.delete(makeKey(prefix, phone));
  }
  return entry.attempts;
}

export function deleteVerification(prefix: string, phone: string): void {
  store.delete(makeKey(prefix, phone));
}
