// Port of src/lib/site.ts
//
// Site-wide configuration constants. The reference sources `url` from a
// validated `NEXT_PUBLIC_SITE_URL` env var (src/env.ts); Angular env wiring
// is out of scope here, so it falls back straight to the same default the
// reference uses when that var is unset.
export const siteConfig = {
  name: 'Lumora — Independent Design & Engineering Studio',
  description:
    'Lumora is an independent studio crafting brands, products, and the systems that connect them — bold ideas, shipped with quiet precision.',
  /**
   * Public origin, no trailing slash. Drives canonical URLs, OG tags, the
   * sitemap, and JSON-LD.
   */
  url: 'http://localhost:3000',
  /**
   * Default Open Graph / Twitter share image. The live image is generated at
   * `src/app/opengraph-image.tsx` in the reference; this path is the
   * JSON-LD fallback.
   */
  ogImage: '/opengraph-image',
  twitterHandle: '@lumorastudio',
  author: 'Lumora Studio',
  /** Browser theme-color (address bar / PWA). */
  themeColor: '#0a0a0a',
} as const;
