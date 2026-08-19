// Port of src/components/animation/springs/progress-trigger.tsx and
// src/hooks/animation/use-progress-trigger.ts
//
// Tracks the host (or `trigger`) element's scroll position between `start`
// and `end` trigger points and exposes a spring-smoothed 0-1 progress value.
// The reference computes this straight from `getBoundingClientRect()` on
// every ticker frame while the element is in view — it does not depend on
// Lenis for the math itself, so this directive does the same rather than
// reading `ScrollProgressService` (see that service's file for the Lenis
// wiring TODO left for a later phase).
import {
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TickerService } from '../animation/ticker.service';
import { WindowSizeService } from '../services/window-size.service';
import { isMobileDisabled, springsConfig } from '../animation/spring-config';
import { runLoopInView } from '../animation/loop-in-view.util';
import { computeTriggerProgress, type TriggerPos } from '../animation/trigger-pos.util';
import { createSpringState, stepSpring, type SpringPhysicsConfig } from '../animation/spring-physics';
import { springPresets } from '../animation/spring-config';

export interface ProgressTriggerChange {
  progress: number;
  interpolatedProgress: number;
}

@Directive({
  selector: '[appProgressTrigger]',
  standalone: true,
})
export class ProgressTriggerDirective {
  readonly start = input<TriggerPos>('top bottom');
  readonly end = input<TriggerPos>('bottom top');
  readonly trigger = input<HTMLElement | ElementRef<HTMLElement> | null>(null);
  readonly progressEnabled = input(true, { alias: 'enabled' });
  readonly disableOnMobile = input(false);
  readonly springConfig = input<SpringPhysicsConfig>(springPresets.default, { alias: 'config' });
  readonly frameInterval = input(10);

  readonly progressChange = output<ProgressTriggerChange>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly ticker = inject(TickerService);
  private readonly windowSize = inject(WindowSizeService);
  private readonly destroyRef = inject(DestroyRef);

  /** Raw 0-1 progress, updated synchronously on the ticker loop. */
  readonly progress = signal(-1);
  /** Spring-smoothed progress. */
  readonly interpolatedProgress = signal(0);

  private springState = createSpringState(0);
  private stopLoop: (() => void) | null = null;
  private lastTickTime: number | null = null;

  constructor() {
    effect((onCleanup) => {
      const triggerInput = this.trigger();
      const start = this.start();
      const end = this.end();
      const enabled = this.progressEnabled();
      const disableOnMobile = this.disableOnMobile();
      const width = this.windowSize.width();
      const config = this.springConfig();
      const frameInterval = this.frameInterval();

      this.stopLoop?.();
      this.stopLoop = null;

      const target = this.resolveTrigger(triggerInput) ?? this.el.nativeElement;
      const active = () =>
        enabled && !isMobileDisabled(springsConfig.disableOnMobile.springtrigger || disableOnMobile, width);

      this.stopLoop = runLoopInView(
        this.ticker,
        target,
        (time) => {
          if (!active() || !target) return;

          const progress = computeTriggerProgress(target, start, end);
          if (progress !== this.progress()) {
            this.progress.set(progress);
          }

          const dt = this.lastTickTime === null ? 16 : Math.min(time - this.lastTickTime, 64);
          this.lastTickTime = time;
          this.springState = stepSpring(this.springState, progress, dt, config);
          this.interpolatedProgress.set(this.springState.position);

          this.progressChange.emit({
            progress,
            interpolatedProgress: this.springState.position,
          });
        },
        { framerate: frameInterval },
      );

      onCleanup(() => {
        this.stopLoop?.();
        this.stopLoop = null;
      });
    });

    this.destroyRef.onDestroy(() => this.stopLoop?.());
  }

  private resolveTrigger(
    trigger: HTMLElement | ElementRef<HTMLElement> | null,
  ): HTMLElement | null {
    if (!trigger) return null;
    return trigger instanceof ElementRef ? trigger.nativeElement : trigger;
  }
}
