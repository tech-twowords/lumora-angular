// Port of src/views/home/hero-card.tsx
//
// The floating panel in the hero's top-right. Acts as a carousel: clicking
// the card (or the prev/next controls) swaps the caption + title with an
// exit/enter animation.
//
// Judgment call: the reference drives the caption/title swap with
// react-spring's `useTransition`, which mounts the incoming item and the
// outgoing item simultaneously and cross-fades them. There is no ready-made
// Angular equivalent for that overlapping mount/unmount transition among the
// directives already ported for this app, so this reimplements the same
// visual beat (fade + 14px vertical slide, direction-aware) as a single
// layer: fade/slide the current caption+title out, swap the underlying data
// while invisible (transition disabled for that one frame via
// `skipTransition`), then fade/slide the new content in. Net effect reads
// the same as the reference at the interaction speeds this carousel is used
// at, without requiring a second overlapping DOM layer.
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { LogoMarkComponent } from '../../../shared/ui/logo-mark/logo-mark.component';
import { IconArrowRightComponent } from '../../../shared/ui/icons/icon-arrow-right.component';
import type { HeroCardItem } from '../../../data/home-content';
import type { StyleValues } from '../../../core/animation/spring-style-runner';

const SWAP_MS = 180;

@Component({
  selector: 'app-hero-card',
  standalone: true,
  imports: [InViewDirective, LogoMarkComponent, IconArrowRightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-card.component.html',
})
export class HeroCardComponent {
  readonly cards = input.required<readonly HeroCardItem[]>();
  /** Gate the entrance animation on the intro loader. */
  readonly enabled = input(true);

  protected readonly index = signal(0);
  protected readonly dir = signal(1);
  /** True for the one frame the content is swapped while invisible — disables the CSS transition so the pre-position jump isn't seen. */
  protected readonly skipTransition = signal(false);

  protected readonly translateY = signal(0);
  protected readonly opacity = signal(1);

  protected readonly current = computed(() => this.cards()[this.index()]);

  protected readonly cardInFrom: StyleValues = {
    opacity: 0,
    transform: 'translateY(16px) scale(0.96)',
  };
  protected readonly cardInTo: StyleValues = { opacity: 1, transform: 'translateY(0px) scale(1)' };
  protected readonly cardInConfig = { tension: 200, friction: 24 };

  private swapTimer: ReturnType<typeof setTimeout> | null = null;

  protected go(step: number): void {
    if (this.swapTimer) return;
    const count = this.cards().length;
    if (count <= 1) return;

    this.dir.set(step);
    this.opacity.set(0);
    this.translateY.set(step * -14);

    this.swapTimer = setTimeout(() => {
      this.index.update((i) => (i + step + count) % count);
      this.skipTransition.set(true);
      this.translateY.set(step * 14);

      requestAnimationFrame(() => {
        this.skipTransition.set(false);
        this.opacity.set(1);
        this.translateY.set(0);
        this.swapTimer = null;
      });
    }, SWAP_MS);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'ArrowRight') this.go(1);
    if (event.key === 'ArrowLeft') this.go(-1);
  }

  protected prev(event: Event): void {
    event.stopPropagation();
    this.go(-1);
  }

  protected next(event: Event): void {
    event.stopPropagation();
    this.go(1);
  }
}
