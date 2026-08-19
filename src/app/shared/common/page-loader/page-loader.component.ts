// Port of src/components/common/page-loader.tsx
//
// Full-screen intro loader. Locks scroll while a counter fills to 100% on an
// eased curve, then slides the overlay up and flips the shared intro gate
// (IntroService) once the exit spring settles. Self-unmounts (phase "done").
//
// The reference drives the fill counter with its own `requestAnimationFrame`
// loop and the exit/content motion with react-spring's `useSpring`
// (including an `onRest` callback to detect when the exit finishes). Neither
// SpringDirective nor HoverDirective expose a "spring settled" event, so —
// like animated-var-text.component.ts — this steps the shared spring
// integrator directly against the shared TickerService instead, which keeps
// everything on the app's single rAF loop while still allowing an explicit
// "done" check each frame.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TickerService } from '../../../core/animation/ticker.service';
import { IntroService } from '../../../core/services/intro.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { createSpringState, stepSpring, type SpringState } from '../../../core/animation/spring-physics';
import { LogoMarkComponent } from '../../ui/logo-mark/logo-mark.component';

type Phase = 'loading' | 'exiting' | 'done';

/** Total time the counter takes to reach 100% (ms). */
const FILL_MS = 1300;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [LogoMarkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-loader.component.html',
})
export class PageLoaderComponent {
  private readonly intro = inject(IntroService);
  private readonly scroll = inject(ScrollService);
  private readonly ticker = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly phase = signal<Phase>('loading');
  protected readonly progress = signal(0);
  protected readonly progressLabel = computed(() => this.progress().toString().padStart(3, '0'));

  protected readonly exitTransform = signal('translateY(0%)');
  protected readonly contentOpacity = signal(1);
  protected readonly contentTransform = signal('translateY(0px)');

  private startedAt: number | null = null;
  private unsubscribeFill: (() => void) | null = null;
  private unsubscribeExit: (() => void) | null = null;
  private lastExitTime: number | null = null;
  private exitYState: SpringState = createSpringState(0);
  private contentOpacityState: SpringState = createSpringState(1);
  private contentYState: SpringState = createSpringState(0);

  constructor() {
    // Lock scroll for the duration of the intro.
    this.scroll.stop();

    this.unsubscribeFill = this.ticker.subscribe(
      (time) => this.tickFill(time),
      () => 0,
    );

    this.destroyRef.onDestroy(() => {
      this.unsubscribeFill?.();
      this.unsubscribeExit?.();
    });
  }

  private tickFill(now: number): void {
    if (this.phase() !== 'loading') return;
    if (this.startedAt === null) this.startedAt = now;
    const t = Math.min((now - this.startedAt) / FILL_MS, 1);
    this.progress.set(Math.round(easeInOutCubic(t) * 100));
    if (t >= 1) {
      this.unsubscribeFill?.();
      this.unsubscribeFill = null;
      this.beginExit();
    }
  }

  private beginExit(): void {
    this.phase.set('exiting');
    this.lastExitTime = null;
    this.unsubscribeExit = this.ticker.subscribe(
      (time) => this.tickExit(time),
      () => 0,
    );
  }

  private tickExit(time: number): void {
    const dt = this.lastExitTime === null ? 16 : Math.min(time - this.lastExitTime, 64);
    this.lastExitTime = time;

    this.exitYState = stepSpring(this.exitYState, -100, dt, { tension: 220, friction: 30 });
    this.contentOpacityState = stepSpring(this.contentOpacityState, 0, dt, {
      tension: 260,
      friction: 26,
    });
    this.contentYState = stepSpring(this.contentYState, -12, dt, { tension: 260, friction: 26 });

    this.exitTransform.set(`translateY(${this.exitYState.position}%)`);
    this.contentOpacity.set(this.contentOpacityState.position);
    this.contentTransform.set(`translateY(${this.contentYState.position}px)`);

    if (this.exitYState.done) {
      this.unsubscribeExit?.();
      this.unsubscribeExit = null;
      this.phase.set('done');
      this.intro.setReady(true);
      this.scroll.start();
    }
  }
}
