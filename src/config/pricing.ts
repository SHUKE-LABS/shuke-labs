// Single source of truth for the commercial bundle: contents, prices, and the
// LemonSqueezy hosted-checkout URLs. Imported by the pricing page and the
// generic + My AI Team product-page CTAs so copy, prices, and links never drift
// apart.

export interface Plan {
  label: string;
  price: string;
  period: string;
  // Condensed cadence for CTA / meta copy (e.g. '/mo'). The full `period`
  // string ('/ month (USD)') is the pricing-card render; this is the blurb render.
  periodShort: string;
  // The LemonSqueezy hosted-checkout URL for this variant.
  checkoutUrl: string;
}

export interface BundleItem {
  name: string;
  note: string;
}

// OPERATOR SETUP (not this ticket's code): replace these placeholders with the
// real LemonSqueezy hosted-checkout URLs once the store's bundle product and its
// monthly / annual variants exist. Until then the CTAs point at the store root.
const LEMONSQUEEZY_CHECKOUT = {
  monthly: 'https://shukelabs.lemonsqueezy.com/buy/REPLACE-WITH-MONTHLY-VARIANT',
  annual: 'https://shukelabs.lemonsqueezy.com/buy/REPLACE-WITH-ANNUAL-VARIANT',
};

export const bundleName = 'My AI Team bundle';

export const plans: Plan[] = [
  {
    label: 'Monthly',
    price: '$5',
    period: '/ month (USD)',
    periodShort: '/mo',
    checkoutUrl: LEMONSQUEEZY_CHECKOUT.monthly,
  },
  {
    label: 'Annual',
    price: '$49.99',
    period: '/ year (USD)',
    periodShort: '/yr',
    checkoutUrl: LEMONSQUEEZY_CHECKOUT.annual,
  },
];

// Condensed bundle-price phrase for CTAs and meta copy: "$5/mo or $49.99/yr".
// Joined over all plans so the blurb stays correct if the plan set changes.
export const bundlePriceSummary = plans.map((p) => `${p.price}${p.periodShort}`).join(' or ');

export const bundleItems: BundleItem[] = [
  { name: 'My AI Team', note: 'The full multi-agent delivery pipeline.' },
  { name: 'Agent Quota Gateway', note: 'Open-core account rotation to keep the pipeline shipping.' },
  { name: 'Rewind', note: 'A browsable, scrollable interface over your AI session files.' },
];

// The pricing surface product pages route to.
export const pricingPath = '/pricing';
