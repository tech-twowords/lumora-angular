// Port of src/utils/seo/structured-data.ts
import { siteConfig } from './site.config';

/**
 * Organization + WebSite schema for the site root. Emit once, in the root
 * shell, inside a `<script type="application/ld+json">` tag.
 */
export function getSiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/android-icon-192x192.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        publisher: { '@id': `${siteConfig.url}/#organization` },
      },
    ],
  };
}
