// Sliding-window rate limiter en memoria.
// Válido para un solo proceso (no distribuido); suficiente para staging/producción single-instance.

const store = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= max) {
    store.set(key, hits);
    return true;
  }

  hits.push(now);
  store.set(key, hits);
  return false;
}

export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
