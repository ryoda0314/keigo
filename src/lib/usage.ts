// 使われ方の数 (components/usage.ts): what is counted, and where. Pure: tested in tests/usage.test.mjs.

/**
 * The same three in every sister, so ことのあめ's admin can set them side by side. open: the app opened (once a page
 * load). learn: a rain finished, gone on to its scene. say: a sentence of the learner's taken in by /api/turn.
 */
export type UsageKind = "open" | "learn" | "say";

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
