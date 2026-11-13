import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'blog'>;

// A zhVersion value is a companion slug only when it isn't an absolute URL —
// external companions live off-site and can't be a local post to hide.
const isSlug = (zhVersion: string): boolean => !/^https?:\/\//.test(zhVersion);

// Slugs of posts referenced as a Chinese companion via another post's zhVersion.
// These are reachable only through the [中文版] link on their English parent.
function companionSlugs(all: Post[]): Set<string> {
  return new Set(
    all
      .map((p) => p.data.zhVersion)
      .filter((v): v is string => v != null && isSlug(v)),
  );
}

// Posts that should surface on their own — the listing, tag pages, and RSS.
// Excludes any post referenced as a companion so it isn't co-listed.
export function visiblePosts(all: Post[]): Post[] {
  const hidden = companionSlugs(all);
  return all.filter((p) => !hidden.has(p.id));
}

// Chronological order: pubDate, then `order` (same-day series), then slug.
// pubDate is the hand-set frontmatter date, not git history: shallow CI clones,
// renames and squash merges make git dates unusable for this.
function chronological(a: Post, b: Post): number {
  const byDate = a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
  if (byDate !== 0) return byDate;
  const oa = a.data.order ?? Number.POSITIVE_INFINITY;
  const ob = b.data.order ?? Number.POSITIVE_INFINITY;
  if (oa !== ob) return oa - ob;
  return a.id.localeCompare(b.id);
}

// The older and newer post in the same language as `post`. Chinese companions
// count: they are hidden from listings, not from a reader already in Chinese.
export function neighbors(all: Post[], post: Post): { prev: Post | null; next: Post | null } {
  const list = all
    .filter((p) => p.data.lang === post.data.lang)
    .sort(chronological);
  const i = list.findIndex((p) => p.id === post.id);
  if (i < 0) return { prev: null, next: null };
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null };
}
