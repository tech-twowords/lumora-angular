// Port of src/views/home/portfolio.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { AnimatedVarTextComponent } from '../../../core/text/animated-var-text.component';
import { EyebrowComponent } from '../../../shared/ui/eyebrow/eyebrow.component';
import { PortfolioCardComponent } from '../portfolio-card/portfolio-card.component';
import type { StyleValues } from '../../../core/animation/spring-style-runner';
import type { SpringPhysicsConfig } from '../../../core/animation/spring-physics';
import type { HomeContent } from '../../../data/home-content';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [InViewDirective, AnimatedVarTextComponent, EyebrowComponent, PortfolioCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio.component.html',
})
export class PortfolioComponent {
  readonly portfolio = input.required<HomeContent['portfolio']>();

  protected readonly eyebrowInViewFrom: StyleValues = { opacity: 0, transform: 'translateY(12px)' };
  protected readonly eyebrowInViewTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };

  protected readonly headingLineIn = { y: '0%', opacity: 1 };
  protected readonly headingLineOut = { y: '100%', opacity: 0 };
  protected readonly headingLineConfig: SpringPhysicsConfig = {};
}
