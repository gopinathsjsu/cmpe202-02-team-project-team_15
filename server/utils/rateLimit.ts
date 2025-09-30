export function makeSocketRateLimiter(limit = 10, windowMs = 10_000) {
  const sent = new WeakMap<any, number[]>();
  return (socket: any) => {
    const now = Date.now();
    const arr = sent.get(socket) ?? [];
    const fresh = arr.filter((t) => now - t < windowMs);
    if (fresh.length >= limit) return false;
    fresh.push(now);
    sent.set(socket, fresh);
    return true;
  };
}
