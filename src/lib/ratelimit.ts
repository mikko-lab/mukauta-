import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let rl: Ratelimit | null = null;

export function getRatelimit(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!rl) {
    rl = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
    });
  }
  return rl;
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function isOriginAllowed(req: Request): boolean {
  const allowed = process.env.ALLOWED_ORIGINS;
  if (!allowed) return true;
  const origin = req.headers.get("origin") ?? "";
  return allowed.split(",").map((o) => o.trim()).includes(origin);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
