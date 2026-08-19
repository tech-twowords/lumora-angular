// Port of src/views/home/partners.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { HoverDirective } from '../../../core/directives/hover.directive';
import { IconCircleDotComponent } from '../../../shared/ui/icons';
import type { StyleValues } from '../../../core/animation/spring-style-runner';
import type { Partner } from '../../../data/home-content';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [InViewDirective, HoverDirective, IconCircleDotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './partners.component.html',
})
export class PartnersComponent {
  readonly label = input.required<string>();
  readonly partners = input.required<readonly Partner[]>();
  /** Gate the entrance animation on the intro loader. */
  readonly enabled = input(true);

  protected readonly inViewFrom: StyleValues = { opacity: 0, transform: 'translateY(14px)' };
  protected readonly inViewTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };
  protected readonly inViewConfig = { tension: 200, friction: 24 };

  protected readonly hoverFrom: StyleValues = { transform: 'translateY(0px)', opacity: 0.7 };
  protected readonly hoverTo: StyleValues = { transform: 'translateY(-2px)', opacity: 1 };
  protected readonly hoverConfig = { tension: 320, friction: 20 };
}
