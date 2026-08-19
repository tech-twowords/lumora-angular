// Port of src/views/home/create-band.tsx
//
// The "We Build → Better" word band. Reads `homeContent.create.words`
// directly per this phase's data-layer convention.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { HoverDirective } from '../../../core/directives/hover.directive';
import { IconArrowRightComponent } from '../../../shared/ui/icons/icon-arrow-right.component';
import { homeContent } from '../../../data/home-content';
import type { CreateWord } from '../../../data/home-content';
import type { StyleValues } from '../../../core/animation/spring-style-runner';

const surfaceByVariant: Record<CreateWord['variant'], string> = {
  light: 'bg-surface text-foreground',
  accent: 'bg-gradient-to-br from-accent-from to-accent-to text-white',
  dark: 'bg-ink text-white',
  ghost: 'bg-surface/60 text-foreground/35',
};

@Component({
  selector: 'app-create-band',
  standalone: true,
  imports: [InViewDirective, HoverDirective, IconArrowRightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-band.component.html',
})
export class CreateBandComponent {
  protected readonly words = homeContent.create.words;

  protected readonly wordInFrom: StyleValues = { opacity: 0, transform: 'translateY(28px)' };
  protected readonly wordInTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };
  protected readonly wordInConfig = { tension: 200, friction: 22 };

  protected readonly wordHoverFrom: StyleValues = { transform: 'scale(1)' };
  protected readonly wordHoverTo: StyleValues = { transform: 'scale(1.03)' };
  protected readonly wordHoverConfig = { tension: 300, friction: 18 };

  protected surfaceClass(variant: CreateWord['variant']): string {
    return surfaceByVariant[variant];
  }

  protected delayFor(index: number): number {
    return index * 120;
  }
}
