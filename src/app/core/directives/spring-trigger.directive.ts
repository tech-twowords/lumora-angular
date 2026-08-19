// Port of src/components/animation/springs/spring-trigger.tsx and
// src/hooks/animation/use-spring-trigger.ts
//
// Like ProgressTriggerDirective, but additionally drives a spring-animated
// style object toward either:
//  - "toggle" mode: `to` once scroll progress reaches 1, `from` otherwise
//  - "scrub" mode: a value linearly interpolated between `from`/`to` at the
//    current scroll progress (the spring then smooths the jump between
//    successive interpolated snapshots as the user scrolls)
// matching `useSpringTrigger`'s `animate(progress)` exactly. The style
// channels are stepped continuously on the shared ticker (react-spring's
// `api.start` re-targets an already-running spring rather than restarting
// it), so scrubbing quickly still produces a smooth chase.
import {
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
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
import {
  createSpringState,
  stepSpring,
  type SpringPhysicsConfig,
  type SpringState,
} from '../animation/spring-physics';
import { interpolate } from '../animation/math.util';
import type { StyleValues } from '../animation/spring-style-runner';

export interface SpringTriggerChange {
  progress: number;
  interpolatedProgress: number;
}

export type SpringTriggerMode = 'toggle' | 'scrub';

interface Channel {
  state: SpringState;
  unit: string | null;
  target: number;
}

function extractNumber(value: string | number): { number: number; unit: string | null } {
  if (typeof value === 'number') return { number: value, unit: null };
  const functionMatch = value.match(/^([a-zA-Z]+)\(([-0-9.]+)([^)]*)\)$/);
  if (functionMatch) {
    return { number: parseFloat(functionMatch[2]), unit: `${functionMatch[1]}(${functionMatch[3]})` };
  }
  const match = value.match(/([-0-9.]+)([^0-9.]+)/);
  if (match) return { number: parseFloat(match[1]), unit: match[2] };
  return { number: 0, unit: null };
}

function formatChannel(channel: Channel): string | number {
  if (channel.unit === null) return channel.state.position;
  if (channel.unit.includes('(')) {
    const fnName = channel.unit.split('(')[0];
    const suffix = channel.unit.split(')')[0].slice(fnName.length);
    return `${fnName}(${channel.state.position}${suffix})`;
  }
  return `${channel.state.position}${channel.unit}`;
}

@Directive({
  selector: '[appSpringTrigger]',
  standalone: true,
})
export class SpringTriggerDirective {
  readonly start = input<TriggerPos>('top bottom');
  readonly end = input<TriggerPos>('bottom top');
  readonly trigger = input<HTMLElement | ElementRef<HTMLElement> | null>(null);
  readonly from = input<StyleValues>({});
  readonly to = input<StyleValues>({});
  readonly springTriggerEnabled = input(true, { alias: 'enabled' });
  readonly disableOnMobile = input(false);
  readonly springConfig = input<SpringPhysicsConfig>({}, { alias: 'config' });
  readonly frameInterval = input(10);
  readonly mode = input<SpringTriggerMode>('scrub');

  readonly progressChange = output<SpringTriggerChange>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly ticker = inject(TickerService);
  private readonly windowSize = inject(WindowSizeService);
  private readonly destroyRef = inject(DestroyRef);

  /** Raw 0-1 progress, updated synchronously on the ticker loop. */
  readonly progress = signal(-1);
  /** Spring-smoothed progress. */
  readonly interpolatedProgress = signal(0);

  private progressSpringState = createSpringState(0);
  private readonly channels = new Map<string, Channel>();
  private stopLoop: (() => void) | null = null;
  private unsubscribeStyleTick: (() => void) | null = null;
  private lastProgressTickTime: number | null = null;
  private lastStyleTickTime: number | null = null;

  constructor() {
    // Seed channels from `from`, mirroring `useSpring(() => ({ from, config }))`.
    effect(() => {
      const from = this.from();
      for (const key in from) {
        if (this.channels.has(key)) continue;
        const { number, unit } = extractNumber(from[key]);
        this.channels.set(key, { state: createSpringState(number), unit, target: number });
      }
      this.paint();
    });

    // Continuously step every channel toward its current target.
    effect((onCleanup) => {
      const config = this.springConfig();
      this.unsubscribeStyleTick?.();
      this.lastStyleTickTime = null;
      this.unsubscribeStyleTick = this.ticker.subscribe(
        (time) => {
          const dt = this.lastStyleTickTime === null ? 16 : Math.min(time - this.lastStyleTickTime, 64);
          this.lastStyleTickTime = time;
          for (const [key, channel] of this.channels) {
            this.channels.set(key, {
              ...channel,
              state: stepSpring(channel.state, channel.target, dt, config),
            });
          }
          this.paint();
        },
        () => 0,
      );
      onCleanup(() => this.unsubscribeStyleTick?.());
    });

    effect((onCleanup) => {
      const triggerInput = this.trigger();
      const start = this.start();
      const end = this.end();
      const enabled = this.springTriggerEnabled();
      const disableOnMobile = this.disableOnMobile();
      const width = this.windowSize.width();
      const config = this.springConfig();
      const frameInterval = this.frameInterval();
      const mode = this.mode();
      const from = this.from();
      const to = this.to();

      this.stopLoop?.();
      this.stopLoop = null;

      const target = this.resolveTrigger(triggerInput) ?? this.el.nativeElement;
      const active = () =>
        enabled &&
        !isMobileDisabled(springsConfig.disableOnMobile.springtrigger || disableOnMobile, width);

      this.stopLoop = runLoopInView(
        this.ticker,
        target,
        (time) => {
          if (!active() || !target) return;

          const progress = computeTriggerProgress(target, start, end);
          if (progress === this.progress()) return;
          this.progress.set(progress);

          const dt =
            this.lastProgressTickTime === null ? 16 : Math.min(time - this.lastProgressTickTime, 64);
          this.lastProgressTickTime = time;
          this.progressSpringState = stepSpring(this.progressSpringState, progress, dt, config);
          this.interpolatedProgress.set(this.progressSpringState.position);

          this.retarget(progress, from, to, mode);

          this.progressChange.emit({
            progress,
            interpolatedProgress: this.progressSpringState.position,
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

  /** Mirrors `useSpringTrigger`'s `animate(progress)`: retargets, does not restart, each channel's spring. */
  private retarget(progress: number, from: StyleValues, to: StyleValues, mode: SpringTriggerMode): void {
    if (!Object.keys(to).length) return;

    const targetValues: StyleValues =
      mode === 'toggle' ? (progress >= 1 ? to : from) : interpolate(from, to, progress);

    for (const key in targetValues) {
      const { number, unit } = extractNumber(targetValues[key]);
      const existing = this.channels.get(key);
      if (existing) {
        existing.target = number;
        existing.unit = unit;
      } else {
        this.channels.set(key, { state: createSpringState(number), unit, target: number });
      }
    }
  }

  private paint(): void {
    const styles: StyleValues = {};
    for (const [key, channel] of this.channels) {
      styles[key] = formatChannel(channel);
    }
    for (const key in styles) {
      this.renderer.setStyle(this.el.nativeElement, key, String(styles[key]));
    }
  }

  private resolveTrigger(
    trigger: HTMLElement | ElementRef<HTMLElement> | null,
  ): HTMLElement | null {
    if (!trigger) return null;
    return trigger instanceof ElementRef ? trigger.nativeElement : trigger;
  }
}
