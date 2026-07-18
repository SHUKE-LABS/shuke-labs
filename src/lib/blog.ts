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
