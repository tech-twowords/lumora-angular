// Port of src/views/home/about.tsx
//
// Studio statement section. Reads `homeContent.about` directly per this
// phase's data-layer convention.
//
// Judgment call: the reference's statement heading is one `TextEngine` whose
// children mix plain text (`about.statement.lead`) with a `text-muted`-styled
// `<span>` (`about.statement.muted`), animated together as one continuous
// word sequence. `AnimatedVarTextComponent` only accepts a single plain
// `text` string (see its header comment), so this renders two adjacent
// instances — one default-colored for `lead`, one `text-muted` for `muted`
// — with the second's `delayIn` offset by `leadWordCount * wordStagger` so
// the stagger reads as one continuous reveal across the color change.
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { HoverDirective } from '../../../core/directives/hover.directive';
import { EyebrowComponent } from '../../../shared/ui/eyebrow/eyebrow.component';
import { PillButtonComponent } from '../../../shared/ui/pill-button/pill-button.component';
import { IconGlobeComponent } from '../../../shared/ui/icons/icon-globe.component';
import { IconXComponent } from '../../../shared/ui/icons/icon-x.component';
import { IconCircleDotComponent } from '../../../shared/ui/icons/icon-circle-dot.component';
import { AnimatedVarTextComponent } from '../../../core/text/animated-var-text.component';
import { homeContent } from '../../../data/home-content';
import type { StyleValues } from '../../../core/animation/spring-style-runner';

const WORD_STAGGER_MS = 35;

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    InViewDirective,
    HoverDirective,
    EyebrowComponent,
    PillButtonComponent,
    IconGlobeComponent,
    IconXComponent,
    IconCircleDotComponent,
    AnimatedVarTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
})
export class AboutComponent {
  protected readonly about = homeContent.about;

  protected readonly leadWordCount = computed(
    () => this.about.statement.lead.trim().split(/\s+/).filter(Boolean).length,
  );
  protected readonly mutedDelayIn = computed(() => this.leadWordCount() * WORD_STAGGER_MS);

  /** Approximates the reference's 700ms `easeOutQuart` word reveal as spring physics. */
  protected readonly wordConfig = { tension: 190, friction: 22 };

  protected readonly globeLabelFrom: StyleValues = { opacity: 0, transform: 'translateY(12px)' };
  protected readonly globeLabelTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };

  protected readonly footerFrom: StyleValues = { opacity: 0, transform: 'translateY(12px)' };
  protected readonly footerTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };

  protected readonly socialHoverFrom: StyleValues = { transform: 'scale(1)' };
  protected readonly socialHoverTo: StyleValues = { transform: 'scale(1.18)' };
  protected readonly socialHoverConfig = { tension: 320, friction: 16 };
}
