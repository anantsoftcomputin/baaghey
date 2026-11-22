import { createHash } from "crypto";
import { adminDatabase } from "@/lib/firebase-admin";

const attempts = new Map<string, { count: number; resetsAt: number }>();

/** Per-instance limiter. Cheap, but on serverless each instance counts on its
 * own, so use `sharedRateLimit` for anything that writes data or holds stock. */
export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetsAt <= now) {
    attempts.set(key, { count: 1, resetsAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

/** Limiter shared by every server instance, counted in Realtime Database under
 * `rateLimits/` (unreadable and unwritable by clients). Falls back to the
 * per-instance limiter if the database is unavailable. */
export async function sharedRateLimit(key: string, limit = 5, windowMs = 60_000) {
  if (!adminDatabase) return rateLimit(key, limit, windowMs);
  const id = createHash("sha256").update(key).digest("hex").slice(0, 40);
  let allowed = false;
  try {
    await adminDatabase.ref(`rateLimits/${id}`).transaction((current: { count: number; resetsAt: number } | null) => {
      const now = Date.now();
      if (!current || current.resetsAt <= now) {
        allowed = true;
        return { count: 1, resetsAt: now + windowMs };
      }
      if (current.count >= limit) {
        allowed = false;
        return;
      }
      allowed = true;
      return { ...current, count: current.count + 1 };
    });
    return allowed;
  } catch (error) {
    console.error("Shared rate limit unavailable; using per-instance limit", error);
    return rateLimit(key, limit, windowMs);
  }
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
