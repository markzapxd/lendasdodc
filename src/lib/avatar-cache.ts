const CACHE_KEY = "larp_avatar_cache_v2";
const TTL_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

interface CachedAvatar {
  url: string;
  timestamp: number;
}

type AvatarCacheMap = Record<string, CachedAvatar>;

export function getCachedAvatarMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};

    const map: AvatarCacheMap = JSON.parse(raw);
    const now = Date.now();
    const result: Record<string, string> = {};

    let modified = false;
    for (const [id, item] of Object.entries(map)) {
      if (now - item.timestamp <= TTL_MS) {
        result[id] = item.url;
      } else {
        delete map[id];
        modified = true;
      }
    }

    if (modified) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(map));
    }

    return result;
  } catch (_e) {
    return {};
  }
}

export function setCachedAvatarMap(newEntries: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const map: AvatarCacheMap = raw ? JSON.parse(raw) : {};
    const now = Date.now();

    for (const [id, url] of Object.entries(newEntries)) {
      map[id] = { url, timestamp: now };
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch (_e) {
    // Ignore storage quota errors
  }
}
