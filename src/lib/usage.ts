// 使われ方の数 (components/usage.ts): what is counted, and where. Pure: tested in tests/usage.test.mjs.

/**
 * The same three in every sister, so ことのあめ's admin can set them side by side. open: the app opened (once a page
 * load). learn: a rain finished, gone on to its scene. say: a sentence of the learner's taken in by /api/turn.
 */
export type UsageKind = "open" | "learn" | "say";

/** The kind of device, as ことのあめ's admin sorts them. */
export type Platform = "ios" | "android" | "pc" | "other";

/**
 * The kind of device from the browser's user agent. An iPad says it is a Mac (iPadOS), but a Mac has no touch screen;
 * Android is asked before Linux, which it also says.
 */
export function platformOf(userAgent: string, maxTouchPoints: number): Platform {
  if (typeof userAgent !== "string" || !userAgent) return "other";
  const touch = typeof maxTouchPoints === "number" ? maxTouchPoints : 0;
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Macintosh/.test(userAgent) && touch > 1) return "ios";
  if (/Android/.test(userAgent)) return "android";
  if (/Windows|Macintosh|CrOS|X11|Linux/.test(userAgent)) return "pc";
  return "other";
}

/**
 * Counted only on the public address (`site`) of a production build: never `npm run dev`, a Vercel preview or a copy
 * served elsewhere. False when either address cannot be read.
 */
export function countsHere(origin: string, site: string, production: boolean): boolean {
  if (!production || !origin || !site) return false;
  try {
    return origin === new URL(site).origin;
  } catch {
    return false;
  }
}
