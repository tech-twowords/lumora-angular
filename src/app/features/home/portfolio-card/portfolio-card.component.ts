// Port of src/views/home/portfolio-card.tsx
//
// Rendered as an `<li>` mapped from `PortfolioComponent`'s `<ul>`, so the
// host is set to `display: contents` and the template's root element is the
// actual `<li>` — keeps the parent `<ul>`'s grid layout unaffected by the
// wrapping `<app-portfolio-card>` custom element.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { HoverDirective } from '../../../core/directives/hover.directive';
import { LogoMarkComponent } from '../../../shared/ui/logo-mark/logo-mark.component';
import { TagChipComponent } from '../../../shared/ui/tag-chip/tag-chip.component';
import { IconArrowUpRightComponent } from '../../../shared/ui/icons';
import type { StyleValues } from '../../../core/animation/spring-style-runner';
import type { PortfolioItem } from '../../../data/home-content';

@Component({
  selector: 'app-portfolio-card',
  standalone: true,
  imports: [
    InViewDirective,
    HoverDirective,
    LogoMarkComponent,
    TagChipComponent,
    IconArrowUpRightComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio-card.component.html',
  host: { '[style.display]': "'contents'" },
})
export class PortfolioCardComponent {
  readonly item = input.required<PortfolioItem>();
  readonly index = input.required<number>();

  protected readonly inViewFrom: StyleValues = { opacity: 0, transform: 'translateY(48px)' };
  protected readonly inViewTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };
  protected readonly inViewConfig = { tension: 180, friction: 26 };

  protected readonly hoverFrom: StyleValues = { transform: 'translateY(0px) scale(1)' };
  protected readonly hoverTo: StyleValues = { transform: 'translateY(-8px) scale(1.012)' };
  protected readonly hoverConfig = { tension: 260, friction: 22 };

  protected readonly arrowFrom: StyleValues = { transform: 'rotate(0deg) scale(1)' };
  protected readonly arrowTo: StyleValues = { transform: 'rotate(45deg) scale(1.08)' };
  protected readonly arrowConfig = { tension: 280, friction: 18 };
}
