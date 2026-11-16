import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

// In-memory cache keyed by absolute file path; invalidated by mtime.
const cache = new Map<string, { mtimeMs: number; url: string }>();

/**
 * Append a content-hash query string to a static asset URL so browsers (and
 * any caching proxy) fetch a fresh copy whenever the underlying file changes.
 * Only local assets under /static/assets are handled; other URLs pass through.
 */
export function cacheBust(url: string): string {
  if (!url || !url.startsWith("/static/assets/")) return url;

  // Only bust text assets that we actually edit between deploys.
  const ext = path.extname(url).toLowerCase();
  if (ext !== ".css" && ext !== ".js") return url;

  const relative = url.replace(/^\/static\//, "");
  const filePath = path.join(process.cwd(), "public", relative);

  try {
    const stat = statSync(filePath);
    const cached = cache.get(filePath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.url;
    }
    const hash = createHash("sha256")
      .update(readFileSync(filePath))
      .digest("hex")
      .slice(0, 10);
    const busted = `${url}?v=${hash}`;
    cache.set(filePath, { mtimeMs: stat.mtimeMs, url: busted });
    return busted;
  } catch {
    return url;
  }
}