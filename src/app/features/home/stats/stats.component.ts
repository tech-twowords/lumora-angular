// Port of src/views/home/stats.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { AnimatedVarTextComponent } from '../../../core/text/animated-var-text.component';
import { EyebrowComponent } from '../../../shared/ui/eyebrow/eyebrow.component';
import { StatCounterComponent } from '../stat-counter/stat-counter.component';
import type { StyleValues } from '../../../core/animation/spring-style-runner';
import type { SpringPhysicsConfig } from '../../../core/animation/spring-physics';
import type { HomeContent } from '../../../data/home-content';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [InViewDirective, AnimatedVarTextComponent, EyebrowComponent, StatCounterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats.component.html',
})
export class StatsComponent {
  readonly stats = input.required<HomeContent['stats']>();

  protected readonly cardInViewFrom: StyleValues = {
    opacity: 0,
    transform: 'translateY(40px) scale(0.99)',
  };
  protected readonly cardInViewTo: StyleValues = { opacity: 1, transform: 'translateY(0px) scale(1)' };
  protected readonly cardInViewConfig = { tension: 180, friction: 26 };

  protected readonly headingLineIn = { y: '0%', opacity: 1 };
  protected readonly headingLineOut = { y: '100%', opacity: 0 };
  protected readonly headingLineConfig: SpringPhysicsConfig = {};
}
