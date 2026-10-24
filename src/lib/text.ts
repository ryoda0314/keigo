// Small pure helpers on Korean text, shared by the server (what came from the learner) and the device (the record).

/** Single spaces, no punctuation at the ends: for comparing pieces of Korean. */
export function normalize(s: string): string {
  return s
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/^[\s"'.,!?~;:()…-]+|[\s"'.,!?~;:()…-]+$/g, "")
    .trim();
}

/** Japanese script anywhere (kana, or kanji, which Korean is not written in here): the learner filled in what Korean
 * did not come out for. */
export function hasJapanese(s: string): boolean {
  return /[぀-ヿ㐀-鿿ｦ-ﾟ]/.test(s);
}

/** Hangul syllables (and letters or digits), the units Korean is compared in. */
function unitsOf(s: string): string[] {
  return normalize(s).match(/[가-힣a-z0-9]/gi) ?? [];
}

/** How many units the two have in common, in order. */
function common(x: string[], y: string[]): number {
  if (!x.length || !y.length) return 0;
  const lcs: number[][] = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) {
    for (let j = y.length - 1; j >= 0; j--) {
      lcs[i][j] = x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  return lcs[0][0];
}

/** How much of `b` `a` keeps, syllable by syllable in order (0..1): to tell a sample sent as it is from one made the
 * learner's own. */
export function sameness(a: string, b: string): number {
  const x = unitsOf(a);
  const y = unitsOf(b);
  return x.length && y.length ? common(x, y) / Math.max(x.length, y.length) : 0;
}

export function syllables(s: string): number {
  return (s.match(/[가-힣]/g) ?? []).length;
}

/**
 * A reply as sentences, for voicing them one by one (the first is heard while the rest are still being made). A piece of
 * under four syllables joins the next (그래. alone would only add a pause). Joined with spaces they give the text back.
 */
export function sentencesOf(text: string): string[] {
  const out: string[] = [];
  const t = text.trim();
  let start = 0;
  for (const m of t.matchAll(/[.!?~…]+["'’”)]?\s+/g)) {
    const end = (m.index ?? 0) + m[0].trimEnd().length;
    out.push(t.slice(start, end));
    start = (m.index ?? 0) + m[0].length;
  }
  if (start < t.length) out.push(t.slice(start));
  const merged: string[] = [];
  for (const piece of out) {
    const last = merged[merged.length - 1];
    if (last !== undefined && syllables(last) < 4) merged[merged.length - 1] = `${last} ${piece}`;
    else merged.push(piece);
  }
  if (merged.length > 1 && syllables(merged[merged.length - 1]) < 4) merged.splice(-2, 2, `${merged[merged.length - 2]} ${merged[merged.length - 1]}`);
  return merged.filter(Boolean);
}
