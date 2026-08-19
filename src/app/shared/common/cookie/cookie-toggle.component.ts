// Port of the local `Toggle` sub-component in
// src/components/common/Cookie/CookiePreferencesModal.tsx
//
// Knob slides on a spring (stepped against the shared TickerService, same
// approach as the other mount/motion transitions in this phase); the track
// colour snaps (a state change, not motion).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TickerService } from '../../../core/animation/ticker.service';
import { createSpringState, stepSpring, type SpringState } from '../../../core/animation/spring-physics';

@Component({
  selector: 'app-cookie-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cookie-toggle.component.html',
})
export class CookieToggleComponent {
  readonly on = input.required<boolean>();
  readonly disabled = input(false);
  readonly label = input.required<string>();
  readonly toggle = output<void>();

  protected readonly x = signal(0);

  private readonly ticker = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  private xState: SpringState = createSpringState(0);
  private target = 0;
  private lastTickTime: number | null = null;
  private unsubscribeTicker: (() => void) | null = null;

  constructor() {
    effect(() => {
      const target = this.on() ? 20 : 0;
      this.retarget(target);
    });
    this.destroyRef.onDestroy(() => this.unsubscribeTicker?.());
  }

  protected onClick(): void {
    if (this.disabled()) return;
    this.toggle.emit();
  }

  private retarget(target: number): void {
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
    this.xState = stepSpring(this.xState, this.target, dt, { tension: 320, friction: 26 });
    this.x.set(this.xState.position);
    if (this.xState.done) {
      this.unsubscribeTicker?.();
      this.unsubscribeTicker = null;
    }
  }
}
