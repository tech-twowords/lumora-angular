// Port of src/components/ui/animated-link.tsx
//
// An `<a>` whose label springs on hover via `appHover` (the link root is the
// hover trigger, so the whole link reacts). Defaults read well for nav/footer
// link lists; pass `from`/`to` to retune the motion.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HoverDirective } from '../../../core/directives/hover.directive';
import type { StyleValues } from '../../../core/animation/spring-style-runner';

@Component({
  selector: 'app-animated-link',
  standalone: true,
  imports: [HoverDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './animated-link.component.html',
})
export class AnimatedLinkComponent {
  readonly href = input.required<string>();
  readonly className = input('', { alias: 'class' });
  /** Inner spring resting / hovered states. Defaults to a subtle x-shift + fade. */
  readonly from = input<StyleValues>({ transform: 'translateX(0px)', opacity: 0.65 });
  readonly to = input<StyleValues>({ transform: 'translateX(4px)', opacity: 1 });
  readonly ariaCurrent = input<'page' | undefined>(undefined, { alias: 'aria-current' });
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  protected readonly hoverConfig = { tension: 320, friction: 22 };
}
