// Port of src/app/layout.tsx
import { Component, DOCUMENT, Renderer2, afterNextRender, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { HomeComponent } from './features/home/home/home.component';
import { CookieLazyComponent } from './shared/common/cookie/cookie-lazy.component';
import { AdaptiveGridService } from './core/services/adaptive-grid.service';
import { ReducedMotionService } from './core/services/reduced-motion.service';
import { ScrollService } from './core/services/scroll.service';
import { siteConfig } from './core/config/site.config';
import { getSiteStructuredData } from './core/config/structured-data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomeComponent, CookieLazyComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  // Mounted once at the app root, mirroring RootLayout's <AdaptiveGrid />,
  // <ReducedMotion />, and <ScrollLayout> — none of these render anything
  // themselves, they just need to be instantiated/started once.
  private readonly adaptiveGrid = inject(AdaptiveGridService);
  private readonly reducedMotion = inject(ReducedMotionService);
  private readonly scroll = inject(ScrollService);

  constructor() {
    this.adaptiveGrid.start();
    this.scroll.init();
    void this.reducedMotion; // constructed for its side effect (matchMedia listener)

    this.setMetadata();

    afterNextRender(() => this.injectStructuredData());
  }

  private setMetadata(): void {
    this.title.setTitle(siteConfig.name);
    this.meta.addTags([
      { name: 'description', content: siteConfig.description },
      { name: 'author', content: siteConfig.author },
      { name: 'theme-color', content: siteConfig.themeColor },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: siteConfig.name },
      { property: 'og:description', content: siteConfig.description },
      { property: 'og:url', content: siteConfig.url },
      { property: 'og:site_name', content: siteConfig.name },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: siteConfig.name },
      { name: 'twitter:description', content: siteConfig.description },
      { name: 'twitter:site', content: siteConfig.twitterHandle },
      { name: 'twitter:creator', content: siteConfig.twitterHandle },
    ]);
  }

  private injectStructuredData(): void {
    const script = this.renderer.createElement('script') as HTMLScriptElement;
    this.renderer.setAttribute(script, 'type', 'application/ld+json');
    script.textContent = JSON.stringify(getSiteStructuredData());
    this.renderer.appendChild(this.document.head, script);
  }
}
