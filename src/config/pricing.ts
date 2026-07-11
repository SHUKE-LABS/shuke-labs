// Single source of truth for the commercial bundle: contents, prices, and the
// LemonSqueezy hosted-checkout URL. Imported by the pricing page and the
// generic + My AI Team product-page CTAs so copy, prices, and links never drift
// apart.
//
// Launch pricing model (issue #47): single-SKU bundle, ANNUAL-ONLY.
//   - Launch price $49.99/yr — honest early-adopter pricing.
//   - Committed future rise to $99/yr after a real customer-count trigger.
//   - Launch cohort is grandfathered at $49.99/yr on renewal.
//   - Risk-reversal is a money-back refund window — NOT a free trial or free
//     tier: the paywall gates update access, so a trial would be a $0
//     grab-and-hold (pin the latest build, keep it after expiry).
// The $99 target, the rise trigger, and the refund window are the issue's
// recommended, operator-tunable instantiation — named constants below so they
// can be tuned without touching page markup. The annual-only model itself is
// the settled decision.
//
// Phase-2 (à la carte standalone SKUs) is DEFERRED, gated on build-readiness of
// the pricing-surface rebuild — not on demand. See issue #47 for the rationale
// so it is not re-litigated here.

export interface Plan {
  label: string;
  price: string;
  period: string;
  // Condensed cadence for CTA / meta copy (e.g. '/yr'). The full `period`
  // string ('/ year (USD)') is the pricing-card render; this is the blurb render.
  periodShort: string;
  // The LemonSqueezy hosted-checkout URL for this variant.
  checkoutUrl: string;
}

export interface BundleItem {
  name: string;
  note: string;
}

// OPERATOR SETUP (not this ticket's code): replace this placeholder with the
// real LemonSqueezy hosted-checkout URL once the store's annual bundle variant
// exists and is configured to support the launch price and its stated future
// rise. Until then the CTA points at the store placeholder.
const LEMONSQUEEZY_CHECKOUT = {
  annual: 'https://shukelabs.lemonsqueezy.com/buy/REPLACE-WITH-ANNUAL-VARIANT',
};

export const bundleName = 'My AI Team bundle';

export const plans: Plan[] = [
  {
    label: 'Annual',
    price: '$49.99',
    period: '/ year (USD)',
    periodShort: '/yr',
    checkoutUrl: LEMONSQUEEZY_CHECKOUT.annual,
  },
];

// Condensed bundle-price phrase for CTAs and meta copy: "$49.99/yr".
// Joined over all plans so the blurb stays correct if the plan set changes.
export const bundlePriceSummary = plans.map((p) => `${p.price}${p.periodShort}`).join(' or ');

// The launch offer's narrative pieces, surfaced on the pricing page. All
// operator-tunable per issue #47, but stated publicly at launch so they are not
// re-litigated at first renewal.
export const launchOffer = {
  // The committed future price and its real, verifiable rise trigger. Honest
  // scarcity — never a perpetually-deferred "rising soon".
  futurePrice: '$99',
  riseTrigger: 'after the first 100 subscribers',
  // Launch cohort keeps the launch price on renewal when the price rises.
  grandfather:
    'Subscribe at launch and keep $49.99/yr for as long as you stay subscribed — when the price rises to $99/yr, only new subscribers pay it.',
  // Risk-reversal: a real money-back window, not a free trial or free tier.
  refund: '14-day money-back guarantee, processed by LemonSqueezy — no questions asked.',
};

export const bundleItems: BundleItem[] = [
  { name: 'My AI Team', note: 'The full multi-agent delivery pipeline.' },
  { name: 'Agent Quota Gateway', note: 'Open-core account rotation to keep the pipeline shipping.' },
  { name: 'Rewind', note: 'A browsable, scrollable interface over your AI session files.' },
];

// The pricing surface product pages route to.
export const pricingPath = '/pricing';
