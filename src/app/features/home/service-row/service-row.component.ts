// Port of src/views/home/service-row.tsx
//
// Rendered as an `<li>` mapped from `ServicesComponent`'s `<ul>`; host is
// `display: contents` so the wrapping `<app-service-row>` element does not
// disturb the parent list's layout.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { HoverDirective } from '../../../core/directives/hover.directive';
import { IconArrowUpRightComponent } from '../../../shared/ui/icons';
import type { StyleValues } from '../../../core/animation/spring-style-runner';
import type { ServiceItem } from '../../../data/home-content';

@Component({
  selector: 'app-service-row',
  standalone: true,
  imports: [InViewDirective, HoverDirective, IconArrowUpRightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-row.component.html',
  host: { '[style.display]': "'contents'" },
})
export class ServiceRowComponent {
  readonly item = input.required<ServiceItem>();
  readonly index = input.required<number>();

  protected readonly inViewFrom: StyleValues = { opacity: 0, transform: 'translateY(24px)' };
  protected readonly inViewTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };
  protected readonly inViewConfig = { tension: 200, friction: 24 };

  protected readonly rowHoverFrom: StyleValues = {
    backgroundColor: 'rgba(241,240,238,0)',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
  };
  protected readonly rowHoverTo: StyleValues = {
    backgroundColor: 'rgba(241,240,238,1)',
    paddingLeft: '2rem',
    paddingRight: '1.25rem',
  };
  protected readonly rowHoverConfig = { tension: 240, friction: 26 };

  protected readonly arrowFrom: StyleValues = { transform: 'translateX(0px)' };
  protected readonly arrowTo: StyleValues = { transform: 'translateX(5px)' };
  protected readonly arrowConfig = { tension: 300, friction: 18 };
}
