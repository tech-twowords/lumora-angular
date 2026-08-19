// Port of src/components/animation/springs/spring.tsx (the `Spring`
// component). Applied as an attribute directive to an existing host element
// rather than wrapping children in a generated tag — Angular directives
// attach to markup the template already declares, so the `tag`/`innerTag`
// prop from the reference (which chose which element react-spring's
// `animated[tag]` should create) has no Angular equivalent and is dropped.
//
// Behavioral note ported verbatim from the reference: `active` becomes
// `true` as soon as the directive is enabled and not mobile-disabled,
// *regardless of `mode`* — the reference's `mode === "once"` /
// `mode === "forward"` branches only ever short-circuit to `true`, they
// never block entry (see spring.tsx's `active` useMemo). `mode="forward"`
// still tracks `scrolledDown` via a scroll listener for parity, but it does
// not gate `active` in the reference either. This looks like latent dead
// code in the source app, but the brief calls for exact behavioral parity,
// so it is intentionally preserved rather than "fixed".
import {
  Directive,
  ElementRef,
  OnDestroy,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';
import { TickerService } from '../animation/ticker.service';
import { ReducedMotionService } from '../services/reduced-motion.service';
import { WindowSizeService } from '../services/window-size.service';
import { HydrationService } from '../services/hydration.service';
import { isMobileDisabled, springsConfig } from '../animation/spring-config';
import { StyleSpringRunner, type StyleValues } from '../animation/spring-style-runner';
import type { SpringPhysicsConfig } from '../animation/spring-physics';

export type SpringMode = 'always' | 'once' | 'forward';

@Directive({
  selector: '[appSpring]',
  standalone: true,
})
export class SpringDirective implements OnDestroy {
  readonly from = input<StyleValues>({});
  readonly to = input<StyleValues>({});
  readonly mode = input<SpringMode>('always');
  readonly springConfig = input<SpringPhysicsConfig>({}, { alias: 'config' });
  readonly delayIn = input(0);
  readonly delayOut = input(0);
  readonly springEnabled = input(true, { alias: 'enabled' });
  readonly disableOnMobile = input(false);
  readonly immediateOut = input(false);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly ticker = inject(TickerService);
  private readonly reducedMotion = inject(ReducedMotionService);
  private readonly windowSize = inject(WindowSizeService);
  private readonly hydration = inject(HydrationService);

  private readonly runner = new StyleSpringRunner(this.ticker, this.reducedMotion, (styles) =>
    this.applyStyles(styles),
  );

  private isAnimated = false;
  private scrolledDown = false;
  private removeScrollListener: (() => void) | null = null;
  private paintedInitial = false;

  constructor() {
    effect(() => {
      const mode = this.mode();
      const disableOnMobile = this.disableOnMobile();
      // Re-attach only when mode/disableOnMobile change (mirrors the
      // reference's `[mode, disableOnMobile, width]` effect deps).
      this.windowSize.width();

      this.removeScrollListener?.();
      this.removeScrollListener = null;

      if (isMobileDisabled(springsConfig.disableOnMobile.spring || disableOnMobile)) {
        return;
      }
      if (mode === 'forward') {
        const handleScroll = () => {
          const rect = this.el.nativeElement.getBoundingClientRect();
          this.scrolledDown = rect.top <= 0;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        this.removeScrollListener = () => window.removeEventListener('scroll', handleScroll);
      }
    });

    effect(() => {
      const from = this.from();
      const to = this.to();
      const mode = this.mode();
      const enabled = this.springEnabled();
      const disableOnMobile = this.disableOnMobile();
      const width = this.windowSize.width();
      const config = this.springConfig();
      const delayIn = this.delayIn();
      const delayOut = this.delayOut();
      const immediateOut = this.immediateOut();
      const hydrated = this.hydration.hydrated();

      if (!this.paintedInitial) {
        this.runner.paintFrom({ from });
        this.paintedInitial = true;
      }
      if (!hydrated) return;

      const active = this.computeActive(mode, enabled, disableOnMobile, width);

      this.runner.set(active, { from, to, config, delayIn, delayOut, immediateOut });
    });
  }

  private computeActive(
    mode: SpringMode,
    enabled: boolean,
    disableOnMobile: boolean,
    width: number,
  ): boolean {
    if (isMobileDisabled(springsConfig.disableOnMobile.spring || disableOnMobile, width)) {
      return false;
    }
    if (!enabled) return false;
    if (mode === 'once' && this.isAnimated) return true;
    if (mode === 'forward' && this.scrolledDown) return true;
    this.isAnimated = true;
    return true;
  }

  private applyStyles(styles: StyleValues): void {
    for (const key in styles) {
      this.renderer.setStyle(this.el.nativeElement, key, String(styles[key]));
    }
  }

  ngOnDestroy(): void {
    this.removeScrollListener?.();
    this.runner.destroy();
  }
}
