// Port of src/components/common/Cookie/CookieBanner.tsx
//
// Mount transition (opacity + y, tension 280 / friction 32) stepped against
// the shared TickerService — see nav-menu.component.ts for the same pattern
// and the rationale (no "spring settled" event on the existing directives).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CookieStoreService } from '../../../core/services/cookie-store.service';
import { TickerService } from '../../../core/animation/ticker.service';
import { createSpringState, stepSpring, type SpringState } from '../../../core/animation/spring-physics';
import { CookieButtonComponent } from './cookie-button.component';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CookieButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cookie-banner.component.html',
})
export class CookieBannerComponent {
  private readonly store = inject(CookieStoreService);
  private readonly ticker = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  // Banner shows only after hydration confirmed no prior consent. Hidden
  // while the preferences modal is up so the two surfaces never compete for
  // focus.
  protected readonly shouldShow = computed(
    () => this.store.hydrated() && this.store.consent() === null && !this.store.modalOpen(),
  );

  protected readonly visible = signal(false);
  protected readonly opacity = signal(0);
  protected readonly y = signal(24);

  private opacityState: SpringState = createSpringState(0);
  private yState: SpringState = createSpringState(24);
  private target: 0 | 1 = 0;
  private lastTickTime: number | null = null;
  private unsubscribeTicker: (() => void) | null = null;

  constructor() {
    effect(() => {
      if (this.shouldShow()) {
        this.visible.set(true);
        this.retarget(1);
      } else {
        this.retarget(0);
      }
    });
    this.destroyRef.onDestroy(() => this.unsubscribeTicker?.());
  }

  protected acceptAll(): void {
    this.store.acceptAll();
  }

  protected rejectAll(): void {
    this.store.rejectAll();
  }

  protected openModal(): void {
    this.store.openModal();
  }

  private retarget(target: 0 | 1): void {
    this.target = target;
    this.lastTickTime = null;
    if (this.unsubscribeTicker) return;
    this.unsubscribeTicker = this.ticker.subscribe(
      (time) => this.tick(time),
      () => 0,
    );
  }

  private tick(time: number): void {
    const dt = this.lastTickTime === null ? 16 : Math.min(time - this.lastTickTime, 64);
    this.lastTickTime = time;
    const config = { tension: 280, friction: 32 };
    const targetY = this.target === 1 ? 0 : 24;

    this.opacityState = stepSpring(this.opacityState, this.target, dt, config);
    this.yState = stepSpring(this.yState, targetY, dt, config);
    this.opacity.set(this.opacityState.position);
    this.y.set(this.yState.position);

    if (this.opacityState.done && this.yState.done) {
      this.unsubscribeTicker?.();
      this.unsubscribeTicker = null;
      if (this.target === 0) this.visible.set(false);
    }
  }
}
