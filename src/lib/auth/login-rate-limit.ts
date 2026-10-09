const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function keyFor(email: string): string {
  return email.trim().toLowerCase();
}

export function loginBlocked(email: string): boolean {
  const row = buckets.get(keyFor(email));
  if (!row) return false;
  if (row.resetAt <= Date.now()) {
    buckets.delete(keyFor(email));
    return false;
  }
  return row.count >= MAX_FAILURES;
}

export function recordLoginFailure(email: string) {
  const key = keyFor(email);
  const now = Date.now();
  const row = buckets.get(key);
  if (!row || row.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  row.count += 1;
}

export function clearLoginFailures(email: string) {
  buckets.delete(keyFor(email));
}
