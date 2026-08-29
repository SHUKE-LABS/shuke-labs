# Product domain naming

SHUKE Labs uses two hostnames for each product:

| Hostname | Use |
| --- | --- |
| `app.<product>.shukelabs.com` | The product application: sign-in, data, and interactive product work. |
| `<product>.shukelabs.com` | The public marketing site: product information, screenshots, pricing, and download links. |

The rule is simple: `app` belongs to the application. The marketing site uses
the product name without a prefix.

## Why this split

The two hosts have different jobs and audiences. A visitor looking for what a
product does should get its public explanation at the shorter product domain.
An existing user going to use the product should get the application at the
explicit `app` host. Keeping that distinction consistent also gives reviewers
an immediate way to identify which deployment a hostname represents.

Do not put the `app` prefix on the marketing site. The prefix describes the
application surface, not a company-wide entry point or an anonymous brand
entry point.

## NewWords

As part of the August 2026 restructuring, the NewWords application is moving
from:

```text
newwords.shukebeta.com
```

to:

```text
app.newwords.shukelabs.com
```

This change records the application/marketing distinction under the SHUKE Labs
domain. When NewWords has a public marketing site, its corresponding hostname
is `newwords.shukelabs.com`, without `app`.

## Future example: Flashcard

For a hypothetical Flashcard product, use:

- `app.flashcard.shukelabs.com` for the application;
- `flashcard.shukelabs.com` for the marketing site.

The same rule applies to future SHUKE Labs products: application hosts get
`app.<product>`, while marketing hosts use `<product>` directly.
