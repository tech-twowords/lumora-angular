// Scroll-progress signals sourced from the shared Lenis instance owned by
// ScrollService. Consumed by ProgressTriggerDirective / SpringTriggerDirective
// as an app-wide alternative to per-element getBoundingClientRect() math.
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { ScrollService } from './scroll.service';

@Injectable({ providedIn: 'root' })
export class ScrollProgressService implements OnDestroy {
  private readonly scrollService = inject(ScrollService);

  private readonly progressSignal = signal(0);
  private readonly scrollYSignal = signal(0);
  private readonly velocitySignal = signal(0);

  /** Normalized 0-1 scroll progress of the whole page (Lenis's own value). */
  readonly progress = this.progressSignal.asReadonly();
  /** Current smoothed scroll offset in px. */
  readonly scrollY = this.scrollYSignal.asReadonly();
  /** Current scroll velocity, as reported by Lenis. */
  readonly velocity = this.velocitySignal.asReadonly();

  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.scrollService.init();
    this.subscribe();
  }

  private subscribe(): void {
    const lenis = this.scrollService.lenis;
    if (!lenis) {
      // Lenis not ready yet on this tick (e.g. SSR/prerender) — try again
      // shortly; init() above is idempotent so this is safe.
      queueMicrotask(() => !this.unsubscribe && this.subscribe());
      return;
    }

    const onScroll = (instance: { progress: number; scroll: number; velocity: number }) => {
      this.progressSignal.set(instance.progress);
      this.scrollYSignal.set(instance.scroll);
      this.velocitySignal.set(instance.velocity);
    };

    lenis.on('scroll', onScroll);
    this.unsubscribe = () => lenis.off('scroll', onScroll);
  }

  /** Manual override seam, kept for parity with directives that don't read Lenis. */
  setProgress(value: number): void {
    this.progressSignal.set(Math.min(Math.max(value, 0), 1));
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }
}
