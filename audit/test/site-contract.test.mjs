// Site-contract tests for issue #146: shukelabs.com is the company site. These
// assert the user-visible route/content contracts from the ticket's acceptance
// criteria against the built `dist/` output, so a future change that drops the
// Cloud badge, retargets a redirect, or restores a removed sales route fails CI.
// They are contract checks, not page snapshots — each test pins one AC clause.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const hasDist = existsSync(dist) && statSync(dist).isDirectory();
const read = (...p) => readFileSync(join(dist, ...p), 'utf8');

// AC1 — the homepage leads with the company and the in-development Cloud
// section, and never carries plan pricing or a checkout link.
test('homepage: company hero, Cloud badge, self-hosted link, no checkout', { skip: !hasDist && 'dist/ not built' }, () => {
  const html = read('index.html');
  assert.match(html, /Build more, struggle less/);
  assert.match(html, /My AI Team Cloud/);
  assert.match(html, /In development/);
  assert.match(html, /href="https:\/\/mat\.shukelabs\.com"/);
  assert.doesNotMatch(html, /lemonsqueezy\.com/i);
  assert.doesNotMatch(html, /\/pricing/);
  assert.match(html, /Latest writing/);
});

// AC1 — inside the Cloud section itself: vision and features only. No form,
// no button, no mailto, and no link other than the sanctioned inline one to
// the self-hosted product site.
test('Cloud section carries no form, button, mailto, or app link', { skip: !hasDist && 'dist/ not built' }, () => {
  const html = read('index.html');
  const cloud = html.match(/<section[^>]*id="cloud"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(cloud, '#cloud section found');
  assert.doesNotMatch(cloud, /<form\b/);
  assert.doesNotMatch(cloud, /<button\b/);
  assert.doesNotMatch(cloud, /mailto:/i);
  const links = [...cloud.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => m[1]);
  const allowed = ['https://mat.shukelabs.com', '#cloud'];
  for (const href of links) {
    assert.ok(
      allowed.some((a) => href === a || href.startsWith(`${a}#`) || href.startsWith('#')),
      `unapproved link inside #cloud: ${href}`,
    );
  }
});

// AC2 — the removed sales routes are gone from the build and `_redirects`
// maps each old path exactly as the ticket lists.
test('removed sales routes absent from dist', { skip: !hasDist && 'dist/ not built' }, () => {
  for (const route of ['pricing/index.html', 'products/my-ai-team/index.html', 'products/my-ai-team/how-it-works/index.html', 'products/my-ai-team/session-modes/index.html']) {
    assert.equal(existsSync(join(dist, route)), false, `${route} must not be built`);
  }
});

test('_redirects maps the five removed paths', () => {
  const lines = read('_redirects')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => l.trim().split(/\s+/));
  const expected = [
    ['/pricing', 'https://mat.shukelabs.com/#plans', '301'],
    ['/products/my-ai-team', 'https://mat.shukelabs.com/', '301'],
    ['/products/my-ai-team/how-it-works', 'https://mat.shukelabs.com/', '301'],
    ['/products/my-ai-team/session-modes', 'https://mat.shukelabs.com/#modes', '301'],
    ['/products/my-ai-team/ideas', '/ideas', '301'],
  ];
  for (const [from, to, status] of expected) {
    const rule = lines.find(([f]) => f === from);
    assert.ok(rule, `missing redirect for ${from}`);
    assert.deepEqual(rule, [from, to, status]);
  }
});

// AC3 — /ideas serves the form with company-scoped copy, and the nav points
// at /ideas without a Pricing link.
test('ideas page: company scope, form wired to the endpoint', { skip: !hasDist && 'dist/ not built' }, () => {
  const html = read('ideas', 'index.html');
  assert.match(html, /any SHUKE\s+Labs product/);
  assert.match(html, /data-endpoint="https:\/\/ideas\.shukelabs\.com"/);
  assert.match(html, /cf-turnstile/);
  assert.match(html, /href="\/"/); // back-link to the company home
  assert.doesNotMatch(html, /products\/my-ai-team/);
});

test('nav: no Pricing link, Submit an idea targets /ideas', { skip: !hasDist && 'dist/ not built' }, () => {
  const nav = read('index.html').match(/<nav[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.ok(nav, 'nav found');
  assert.doesNotMatch(nav, /href="\/pricing"/);
  assert.match(nav, /href="\/ideas"/);
});

// AC4 — the schema has optional `site`, and the My AI Team card links out
// externally instead of to a local detail page.
test('product schema carries optional site url', () => {
  const schema = readFileSync(join(root, 'src', 'content.config.ts'), 'utf8');
  assert.match(schema, /site:\s*z\.string\(\)\.url\(\)\.optional\(\)/);
});

test('My AI Team card links to mat.shukelabs.com', { skip: !hasDist && 'dist/ not built' }, () => {
  const html = read('index.html');
  // Several anchors may target the product site (the Cloud section's inline
  // link too); the card is the one ProductCard rendered — external, with
  // rel=noopener, wrapping the product title.
  const anchors = html.match(/<a\b[^>]*href="https:\/\/mat\.shukelabs\.com"[^>]*>[\s\S]*?<\/a>/g) ?? [];
  const card = anchors.find((a) => a.includes('rel="noopener"'));
  assert.ok(card, 'external product-card link found');
  assert.match(card, /My AI Team/);
  assert.doesNotMatch(html, /href="\/products\/my-ai-team"/);
});

test('my-ai-team frontmatter sets site and keeps no body', () => {
  const md = readFileSync(join(root, 'src', 'content', 'products', 'my-ai-team.md'), 'utf8');
  assert.match(md, /site:\s*"https:\/\/mat\.shukelabs\.com"/);
  assert.doesNotMatch(md, /^[\s\S]*This product has a dedicated hand-composed page/);
});

// AC5 — terms-of-sale points buyers at the product site.
test('terms-of-sale names mat.shukelabs.com', { skip: !hasDist && 'dist/ not built' }, () => {
  const html = read('terms', 'index.html');
  assert.match(html, /id="terms-of-sale"/);
  assert.match(html, /href="https:\/\/mat\.shukelabs\.com"/);
  assert.doesNotMatch(html, /sold on this site/);
});

// AC2/AC7 — source-level deletion constraints, enforced on the tree rather
// than the build output, so re-adding a removed file or reference fails here
// even if the build still succeeds.
test('removed sales source files stay deleted', () => {
  for (const f of ['src/config/pricing.ts', 'src/pages/pricing.astro', 'src/pages/products/my-ai-team.astro', 'src/pages/products/my-ai-team/how-it-works.astro', 'src/pages/products/my-ai-team/session-modes.astro']) {
    assert.equal(existsSync(join(root, f)), false, `${f} must stay deleted`);
  }
});

// grep exits 0 when it finds matches and 1 when it finds none; here "none"
// is the passing state, so collapse both into a result instead of letting
// execFileSync throw on rc 1.
function grepSearch(args) {
  try {
    return { rc: 0, out: execFileSync('grep', args, { encoding: 'utf8' }) };
  } catch (e) {
    return { rc: e.status, out: e.stdout ?? '' };
  }
}

test('src carries no checkout link', () => {
  const { rc, out } = grepSearch(['-rl', 'lemonsqueezy.com/checkout', join(root, 'src')]);
  if (rc === 0) assert.fail(`lemonsqueezy.com/checkout found in:\n${out.trim()}`);
  assert.equal(rc, 1, `grep failed (rc ${rc})`);
});

test('no products/my-ai-team route reference outside blog content', () => {
  const { rc, out } = grepSearch([
    '-rn',
    'products/my-ai-team',
    join(root, 'src'),
    join(root, 'docs'),
    join(root, 'README.md'),
    '--exclude-dir=blog',
  ]);
  if (rc === 0) assert.fail(`stale route references found:\n${out.trim()}`);
  assert.equal(rc, 1, `grep failed (rc ${rc})`);
});
