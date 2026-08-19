// Port of src/components/animation/springs/in-view.tsx (the `Inview`
// component), plus the IntersectionObserver logic from
// src/hooks/animation/use-dynamic-in-view.ts it uses internally. Unlike the
// reference's `innerTag`/`innerClassName` (which wrapped children in a
// second animated element so the outer element could carry the
// IntersectionObserver ref independently of the animated style), this
// directive always animates the styles of the element it is observing —
// wrap that element in an extra `<span appSpring>`-less node in the template
// if a two-layer split is ever needed.
//
// Unlike SpringDirective, `mode` here correctly gates entry (see
// use-dynamic-in-view.ts-derived `inView` state below): `once` latches
// active permanently after the first time the element enters the viewport,
// `forward` stays active once scrolled past, otherwise mirrors `always`
// (mirrors `inView` live).
import {
  Directive,
  ElementRef,
  OnDestroy,
  Renderer2,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TickerService } from '../animation/ticker.service';
import { ReducedMotionService } from '../services/reduced-motion.service';
import { WindowSizeService } from '../services/window-size.service';
import { HydrationService } from '../services/hydration.service';
import { isMobileDisabled, springsConfig } from '../animation/spring-config';
import { StyleSpringRunner, type StyleValues } from '../animation/spring-style-runner';
import type { SpringPhysicsConfig } from '../animation/spring-physics';
import type { SpringMode } from './spring.directive';

@Directive({
  selector: '[appInView]',
  standalone: true,
})
export class InViewDirective implements OnDestroy {
  readonly from = input<StyleValues>({});
  readonly to = input<StyleValues>({});
  readonly mode = input<SpringMode>('always');
  readonly springConfig = input<SpringPhysicsConfig>({}, { alias: 'config' });
  readonly delayIn = input(0);
  readonly delayOut = input(0);
  readonly inViewEnabled = input(true, { alias: 'enabled' });
  readonly disableOnMobile = input(false);
  readonly immediateOut = input(true);
  /** IntersectionObserver options, mirroring use-dynamic-in-view.ts's `IntersectionObserverOptions`. */
  readonly root = input<Element | Document | null>(null);
  readonly rootMargin = input<string | undefined>(undefined);
  readonly threshold = input<number | number[] | undefined>(undefined);
  /** Optional external element to observe instead of the host. */
  readonly viewTrigger = input<HTMLElement | ElementRef<HTMLElement> | null>(null, {
    alias: 'trigger',
  });

  readonly entered = output<void>();
  readonly left = output<void>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly ticker = inject(TickerService);
  private readonly reducedMotion = inject(ReducedMotionService);
  private readonly windowSize = inject(WindowSizeService);
  private readonly hydration = inject(HydrationService);

  private readonly runner = new StyleSpringRunner(this.ticker, this.reducedMotion, (styles) =>
    this.applyStyles(styles),
  );

  private readonly inView = signal(false);
  private observer: IntersectionObserver | null = null;
  private isAnimated = false;
  private scrolledDown = false;
  private removeScrollListener: (() => void) | null = null;
  private paintedInitial = false;

  constructor() {
    effect(() => {
      const triggerInput = this.viewTrigger();
      const root = this.root();
      const rootMargin = this.rootMargin();
      const threshold = this.threshold();

      this.observer?.disconnect();
      this.observer = null;

      const target = this.resolveTrigger(triggerInput) ?? this.el.nativeElement;
      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.inView.set(entry.isIntersecting);
          if (entry.isIntersecting) this.entered.emit();
          else this.left.emit();
        },
        { root, rootMargin, threshold },
      );
      this.observer.observe(target);
    });

    effect(() => {
      const mode = this.mode();
      const disableOnMobile = this.disableOnMobile();
      this.windowSize.width();

      this.removeScrollListener?.();
      this.removeScrollListener = null;

      if (isMobileDisabled(springsConfig.disableOnMobile.inview || disableOnMobile)) {
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
      const enabled = this.inViewEnabled();
      const disableOnMobile = this.disableOnMobile();
      const width = this.windowSize.width();
      const config = this.springConfig();
      const delayIn = this.delayIn();
      const delayOut = this.delayOut();
      const immediateOut = this.immediateOut();
      const hydrated = this.hydration.hydrated();
      const inView = this.inView();

      if (!this.paintedInitial) {
        this.runner.paintFrom({ from });
        this.paintedInitial = true;
      }
      if (!hydrated) return;

      const active = this.computeActive(mode, enabled, disableOnMobile, width, inView);
      this.runner.set(active, { from, to, config, delayIn, delayOut, immediateOut });
    });
  }

  private resolveTrigger(
    trigger: HTMLElement | ElementRef<HTMLElement> | null,
  ): HTMLElement | null {
    if (!trigger) return null;
    return trigger instanceof ElementRef ? trigger.nativeElement : trigger;
  }

  private computeActive(
    mode: SpringMode,
    enabled: boolean,
    disableOnMobile: boolean,
    width: number,
    inView: boolean,
  ): boolean {
    if (isMobileDisabled(springsConfig.disableOnMobile.inview || disableOnMobile, width)) {
      return false;
    }
    if (!enabled) return false;
    if (mode === 'once' && this.isAnimated) return true;
    if (mode === 'forward' && this.scrolledDown) return true;
    if (!this.isAnimated) this.isAnimated = inView;
    return inView;
  }

  private applyStyles(styles: StyleValues): void {
    for (const key in styles) {
      this.renderer.setStyle(this.el.nativeElement, key, String(styles[key]));
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.removeScrollListener?.();
    this.runner.destroy();
  }
}
