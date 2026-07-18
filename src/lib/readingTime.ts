// Estimated reading time from a post's raw markdown body.
//
// Language-aware: CJK scripts have no whitespace word boundaries, so a
// whitespace split badly undercounts Chinese posts. Count CJK characters
// directly (~350 chars/min) for zh, and whitespace-delimited words (~220 wpm)
// otherwise. Floor at 1 minute so short posts never read "0 min".
const WORDS_PER_MIN = 220;
const CJK_CHARS_PER_MIN = 350;
const CJK = /[一-鿿㐀-䶿぀-ヿ]/g;

export function readingTime(body: string, lang: string): { minutes: number; label: string } {
  const cjkCount = (body.match(CJK) ?? []).length;
  const minutes =
    lang === 'zh'
      ? Math.max(1, Math.round(cjkCount / CJK_CHARS_PER_MIN))
      : Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / WORDS_PER_MIN));
  return { minutes, label: `${minutes} min read` };
}
