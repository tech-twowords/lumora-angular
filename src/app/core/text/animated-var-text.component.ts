// Port of src/components/animation/springs/animated-var-text-tag.tsx AND a
// reimplementation of the `spring-text-engine` package usage seen in the
// reference app (e.g. `<TextEngine tag="h1" mode="once" overflow lineIn={...}
// lineOut={...} lineStagger={120} lineConfig={...} delayIn={250}>`, see
// src/views/home/hero.tsx). `spring-text-engine` is a React-only package
// built on `@react-spring/web` with no Angular/framework-agnostic
// equivalent, so its line-split + staggered spring reveal behavior is
// reimplemented here in plain TS/DOM against the same spring integrator
// used by the other directives in this module.
//
// Judgment call: the reference's exact line-splitting algorithm (how it
// measures wrapped text into visual lines) is internal to the closed-source
// `spring-text-engine` package and not visible from the call site, so this
// component approximates it by wrapping each *word* in an inline-block span
// (so CSS line-wrapping still happens naturally) and staggering the reveal
// per word — the same visual effect (`lineIn`/`lineOut` translate+opacity,
// staggered by `lineStagger` ms) as the "line" stagger, at word granularity
// instead of measured-line granularity. `overflow` clips each word's
// vertical travel the way the reference's line masking does.
import {
  Component,
  ElementRef,
  Renderer2,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { TickerService } from '../animation/ticker.service';
import { ReducedMotionService } from '../services/reduced-motion.service';
import { HydrationService } from '../services/hydration.service';
import {
  createSpringState,
  stepSpring,
  type SpringPhysicsConfig,
  type SpringState,
} from '../animation/spring-physics';
import type { SpringMode } from '../directives/spring.directive';

export type AnimatedVarTextTag =
  | 'span'
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'div';

interface WordUnit {
  el: HTMLElement;
  inner: HTMLElement;
  y: { state: SpringState; unit: string };
  opacity: { state: SpringState };
}

@Component({
  selector: 'app-animated-var-text',
  standalone: true,
  template: `<ng-content />`,
  host: {
    '[style.display]': `"contents"`,
  },
})
export class AnimatedVarTextComponent {
  readonly text = input.required<string>();
  readonly tag = input<AnimatedVarTextTag>('span');
  readonly mode = input<SpringMode>('once');
  readonly overflow = input(true);
  readonly lineIn = input<{ y?: string; opacity?: number }>({ y: '0%', opacity: 1 });
  readonly lineOut = input<{ y?: string; opacity?: number }>({ y: '100%', opacity: 0 });
  /** Per-word stagger, ms (named `lineStagger` after the reference's per-line stagger). */
  readonly lineStagger = input(60);
  readonly lineConfig = input<SpringPhysicsConfig>({});
  readonly delayIn = input(0);
  readonly delayOut = input(0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly ticker = inject(TickerService);
  private readonly reducedMotion = inject(ReducedMotionService);
  private readonly hydration = inject(HydrationService);

  private words: WordUnit[] = [];
  private unsubscribeTicker: (() => void) | null = null;
  private lastTime: number | null = null;
  private isAnimated = false;

  constructor() {
    effect(() => {
      const text = this.text();
      const overflow = this.overflow();
      this.buildWords(text, overflow);
    });

    effect(() => {
      const mode = this.mode();
      const hydrated = this.hydration.hydrated();
      if (!hydrated) return;
      if (!this.words.length) return;
      // "once" (the reference's default for TextEngine) reveals a single
      // time; re-running this effect (e.g. on later signal changes) must not
      // replay it. "always"/"forward" are not meaningfully different here
      // since there is no exit trigger for standalone text — kept as a
      // no-op distinction for API parity with TextEngine's `mode` prop.
      if (mode === 'once' && this.isAnimated) return;
      this.isAnimated = true;

      this.animateIn();
    });
  }

  private buildWords(text: string, overflow: boolean): void {
    this.unsubscribeTicker?.();
    this.unsubscribeTicker = null;
    const host = this.el.nativeElement;
    while (host.firstChild) host.removeChild(host.firstChild);

    const lineIn = this.lineIn();
    const words = text.split(/(\s+)/).filter((chunk) => chunk.length > 0);
    this.words = [];

    for (const chunk of words) {
      if (/^\s+$/.test(chunk)) {
        host.appendChild(document.createTextNode(chunk));
        continue;
      }

      const outer = this.renderer.createElement('span') as HTMLElement;
      this.renderer.setStyle(outer, 'display', 'inline-block');
      if (overflow) this.renderer.setStyle(outer, 'overflow', 'hidden');
      this.renderer.setStyle(outer, 'vertical-align', 'top');

      const inner = this.renderer.createElement('span') as HTMLElement;
      this.renderer.setStyle(inner, 'display', 'inline-block');
      this.renderer.setStyle(inner, 'will-change', 'transform, opacity');

      const startY = extractPercent(lineIn.y ?? '0%');
      const startOpacity = lineIn.opacity ?? 1;

      inner.textContent = chunk;
      this.renderer.appendChild(outer, inner);
      this.renderer.appendChild(host, outer);

      this.words.push({
        el: outer,
        inner,
        y: { state: createSpringState(startY), unit: '%' },
        opacity: { state: createSpringState(startOpacity) },
      });
    }

    this.paint();
  }

  private animateIn(): void {
    const lineIn = this.lineIn();
    const stagger = this.lineStagger();
    const delayIn = this.delayIn();
    const config = this.lineConfig();
    const targetY = extractPercent(lineIn.y ?? '0%');
    const targetOpacity = lineIn.opacity ?? 1;

    this.words.forEach((word, index) => {
      const delay = delayIn + index * stagger;
      const start = () => this.startTicking(config);
      if (delay > 0 && !this.reducedMotion.reducedMotion()) {
        setTimeout(() => {
          this.retarget(word, targetY, targetOpacity);
          start();
        }, delay);
      } else {
        this.retarget(word, targetY, targetOpacity);
        start();
      }
    });
  }

  private retarget(word: WordUnit, targetY: number, targetOpacity: number): void {
    if (this.reducedMotion.reducedMotion()) {
      word.y.state = { position: targetY, velocity: 0, done: true };
      word.opacity.state = { position: targetOpacity, velocity: 0, done: true };
      this.paintWord(word);
      return;
    }
    // Retarget in place so an in-flight spring keeps its current
    // position/velocity (matches react-spring's `api.start` re-target).
    word.y.state = { ...word.y.state, done: false };
    word.opacity.state = { ...word.opacity.state, done: false };
    (word as unknown as { targetY: number; targetOpacity: number }).targetY = targetY;
    (word as unknown as { targetOpacity: number }).targetOpacity = targetOpacity;
  }

  private startTicking(config: SpringPhysicsConfig): void {
    if (this.unsubscribeTicker) return;
    this.lastTime = null;
    this.unsubscribeTicker = this.ticker.subscribe(
      (time) => this.tick(time, config),
      () => 0,
    );
  }

  private tick(time: number, config: SpringPhysicsConfig): void {
    const dt = this.lastTime === null ? 16 : Math.min(time - this.lastTime, 64);
    this.lastTime = time;

    let allDone = true;
    for (const word of this.words) {
      const targets = word as unknown as { targetY?: number; targetOpacity?: number };
      const targetY = targets.targetY ?? word.y.state.position;
      const targetOpacity = targets.targetOpacity ?? word.opacity.state.position;
      word.y.state = stepSpring(word.y.state, targetY, dt, config);
      word.opacity.state = stepSpring(word.opacity.state, targetOpacity, dt, config);
      if (!word.y.state.done || !word.opacity.state.done) allDone = false;
    }

    this.paint();

    if (allDone) {
      this.unsubscribeTicker?.();
      this.unsubscribeTicker = null;
    }
  }

  private paint(): void {
    for (const word of this.words) this.paintWord(word);
  }

  private paintWord(word: WordUnit): void {
    this.renderer.setStyle(
      word.inner,
      'transform',
      `translateY(${word.y.state.position}${word.y.unit})`,
    );
    this.renderer.setStyle(word.inner, 'opacity', String(word.opacity.state.position));
  }
}

function extractPercent(value: string | number): number {
  if (typeof value === 'number') return value;
  const match = value.match(/-?[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}
