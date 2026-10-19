export const CREDIT_BUNDLES = [
  { id: "starter", name: "Starter", credits: 250, discountPercent: 10 },
  { id: "pro", name: "Pro", credits: 600, discountPercent: 15 },
  { id: "power", name: "Power", credits: 1200, discountPercent: 20 },
]

export const MIN_CUSTOM_CREDITS = 100
export const MAX_CUSTOM_CREDITS = 100000

// The base rate is $1 for every 100 credits. Bundles apply their discount to
// that base USD amount before converting to INR and rounding to whole rupees.
export const priceCreditsInRupees = (credits, usdInrRate, discountPercent = 0) =>
  Math.max(1, Math.round((credits / 100) * usdInrRate * (1 - discountPercent / 100)))
