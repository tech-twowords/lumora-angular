// Shared engine behind SpringDirective, HoverDirective and InViewDirective.
// Not a 1:1 port of a single reference file — it factors out the identical
// `useSpring({ from, to: active ? to : from, config, delay: active ? delayIn
// : delayOut, immediate: !active && immediateOut })` pattern duplicated
// across springs/spring.tsx, springs/hover.tsx and springs/in-view.tsx, so
// each directive only has to own its own "what does `active` mean" logic
// (mode/scroll/hover/in-view) and hand a boolean to this runner.
import type { TickerService } from './ticker.service';
import type { ReducedMotionService } from '../services/reduced-motion.service';
import {
  createSpringState,
  stepSpring,
  type SpringPhysicsConfig,
  type SpringState,
} from './spring-physics';

export type StyleValues = Record<string, string | number>;

export interface StyleSpringOptions {
  from: StyleValues;
  to: StyleValues;
  config: SpringPhysicsConfig;
  /** Delay (ms) before animating toward the active target. */
  delayIn: number;
  /** Delay (ms) before animating back to `from` when inactive. */
  delayOut: number;
  /** Skip the exit (inactive) animation and snap straight to `from`. */
  immediateOut: boolean;
}

interface Channel {
  state: SpringState;
  unit: string | null;
  target: number;
}

function extractNumber(value: string | number): { number: number; unit: string | null } {
  if (typeof value === 'number') return { number: value, unit: null };
  const functionMatch = value.match(/^([a-zA-Z]+)\(([-0-9.]+)([^)]*)\)$/);
  if (functionMatch) {
    return {
      number: parseFloat(functionMatch[2]),
      unit: `${functionMatch[1]}(${functionMatch[3]})`,
    };
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

/** Applies `styles` to an element's inline style, driven by per-frame spring stepping. */
export class StyleSpringRunner {
  private readonly channels = new Map<string, Channel>();
  private unsubscribeTicker: (() => void) | null = null;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTime: number | null = null;
  private running = false;

  constructor(
    private readonly ticker: TickerService,
    private readonly reducedMotion: ReducedMotionService,
    private readonly applyStyle: (styles: StyleValues) => void,
  ) {}

  /** Renders `opts.from` immediately, without animating (used before hydration/mount). */
  paintFrom(opts: Pick<StyleSpringOptions, 'from'>): void {
    const styles: StyleValues = {};
    for (const key in opts.from) {
      const { number, unit } = extractNumber(opts.from[key]);
      this.channels.set(key, { state: createSpringState(number), unit, target: number });
      styles[key] = opts.from[key];
    }
    this.applyStyle(styles);
  }

  /** Mirrors setting `to: active ? to : from` on a declarative `useSpring`. */
  set(active: boolean, opts: StyleSpringOptions): void {
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }

    const targetValues = active ? opts.to : opts.from;
    const immediateNow =
      (!active && opts.immediateOut) || this.reducedMotion.reducedMotion();
    const delay = active ? opts.delayIn : opts.delayOut;

    const run = () => this.animateTo(targetValues, opts.from, opts.config, immediateNow);
    if (delay > 0 && !immediateNow) {
      this.delayTimer = setTimeout(run, delay);
    } else {
      run();
    }
  }

  private animateTo(
    targetValues: StyleValues,
    fromValues: StyleValues,
    config: SpringPhysicsConfig,
    immediate: boolean,
  ): void {
    const keys = new Set([...Object.keys(targetValues), ...Object.keys(fromValues)]);
    for (const key of keys) {
      const raw = targetValues[key] ?? fromValues[key];
      const { number, unit } = extractNumber(raw);
      const existing = this.channels.get(key);
      if (immediate) {
        this.channels.set(key, { state: createSpringState(number), unit, target: number });
      } else if (existing) {
        existing.target = number;
        existing.unit = unit;
      } else {
        this.channels.set(key, { state: { position: number, velocity: 0, done: false }, unit, target: number });
      }
    }

    if (immediate) {
      this.emit();
      return;
    }

    this.startTicking(config);
  }

  private startTicking(config: SpringPhysicsConfig): void {
    if (this.running) return;
    this.running = true;
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
    for (const channel of this.channels.values()) {
      channel.state = stepSpring(channel.state, channel.target, dt, config);
      if (!channel.state.done) allDone = false;
    }

    this.emit();

    if (allDone) {
      this.stopTicking();
    }
  }

  private stopTicking(): void {
    this.running = false;
    this.lastTime = null;
    if (this.unsubscribeTicker) {
      this.unsubscribeTicker();
      this.unsubscribeTicker = null;
    }
  }

  private emit(): void {
    const styles: StyleValues = {};
    for (const [key, channel] of this.channels) {
      styles[key] = formatChannel(channel);
    }
    this.applyStyle(styles);
  }

  destroy(): void {
    if (this.delayTimer !== null) clearTimeout(this.delayTimer);
    this.stopTicking();
  }
}
