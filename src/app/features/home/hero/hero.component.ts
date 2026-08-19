// Port of src/views/home/hero.tsx
//
// Main hero section. Reads `homeContent.hero` directly per this phase's
// data-layer convention.
//
// Judgment calls:
// - `TextEngine` (the `spring-text-engine` package) has no framework-neutral
//   equivalent; the heading uses `AnimatedVarTextComponent`
//   (`core/text/animated-var-text.component.ts`), which reveals per-word
//   instead of per measured-line (see that file's header comment). Since
//   that component's host is `display: contents` and has no dynamic tag, the
//   real `<h1 id="hero-heading">` element wraps it here instead of relying
//   on its unused `tag` input.
// - `Partners` (`views/home/partners.tsx`) renders via `<app-partners>`
//   (`features/home/partners/partners.component.ts`), built separately.
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { LiquidRevealComponent } from '../../../shared/common/liquid-reveal/liquid-reveal.component';
import { EyebrowComponent } from '../../../shared/ui/eyebrow/eyebrow.component';
import { PillButtonComponent } from '../../../shared/ui/pill-button/pill-button.component';
import { IconStarComponent } from '../../../shared/ui/icons/icon-star.component';
import { AnimatedVarTextComponent } from '../../../core/text/animated-var-text.component';
import { HeroCardComponent } from '../hero-card/hero-card.component';
import { PartnersComponent } from '../partners/partners.component';
import { IntroService } from '../../../core/services/intro.service';
import { RequestModalService } from '../../../core/services/request-modal.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { homeContent } from '../../../data/home-content';
import type { StyleValues } from '../../../core/animation/spring-style-runner';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [
    InViewDirective,
    LiquidRevealComponent,
    EyebrowComponent,
    PillButtonComponent,
    IconStarComponent,
    AnimatedVarTextComponent,
    HeroCardComponent,
    PartnersComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  protected readonly intro = inject(IntroService);
  private readonly requestModal = inject(RequestModalService);
  private readonly scroll = inject(ScrollService);

  protected readonly hero = homeContent.hero;
  protected readonly starIndices = Array.from({ length: homeContent.hero.rating });

  protected readonly watermarkFrom: StyleValues = { opacity: 0, transform: 'translateY(20px)' };
  protected readonly watermarkTo: StyleValues = { opacity: 0.4, transform: 'translateY(0px)' };
  protected readonly watermarkConfig = { tension: 120, friction: 30 };

  protected readonly eyebrowFrom: StyleValues = { opacity: 0, transform: 'translateY(10px)' };
  protected readonly eyebrowTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };

  protected readonly ratingFrom: StyleValues = { opacity: 0, transform: 'translateY(10px)' };
  protected readonly ratingTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };

  protected readonly ctaFrom: StyleValues = { opacity: 0, transform: 'translateY(12px)' };
  protected readonly ctaTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };

  protected readonly footerFrom: StyleValues = { opacity: 0 };
  protected readonly footerTo: StyleValues = { opacity: 1 };

  /** Approximates the reference's 900ms `easeOutCubic` line reveal as spring physics. */
  protected readonly headingLineConfig = { tension: 170, friction: 24 };

  protected openModal(): void {
    this.requestModal.openModal();
  }

  protected scrollToWorks(): void {
    this.scroll.scrollTo(this.hero.secondaryCta.href.replace('#', ''));
  }
}
