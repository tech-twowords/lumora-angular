// Port of src/components/animation/springs/hover.tsx (the `Hover` component)
// Applies a spring-driven style change on mouse enter/leave, either on the
// host element itself or on an external `trigger` element.
import {
  Directive,
  ElementRef,
  OnDestroy,
  Renderer2,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { TickerService } from '../animation/ticker.service';
import { ReducedMotionService } from '../services/reduced-motion.service';
import { WindowSizeService } from '../services/window-size.service';
import { HydrationService } from '../services/hydration.service';
import { isMobileDisabled, springsConfig } from '../animation/spring-config';
import { StyleSpringRunner, type StyleValues } from '../animation/spring-style-runner';
import type { SpringPhysicsConfig } from '../animation/spring-physics';

@Directive({
  selector: '[appHover]',
  standalone: true,
})
export class HoverDirective implements OnDestroy {
  readonly from = input<StyleValues>({});
  readonly to = input<StyleValues>({});
  readonly springConfig = input<SpringPhysicsConfig>({}, { alias: 'config' });
  readonly delayIn = input(0);
  readonly delayOut = input(0);
  readonly hoverEnabled = input(true, { alias: 'enabled' });
  /** Optional external element to listen for hover on instead of the host. */
  readonly hoverTrigger = input<HTMLElement | ElementRef<HTMLElement> | null>(null, {
    alias: 'trigger',
  });
  readonly disableOnMobile = input(true);
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

  private readonly hovered = signal(false);
  private removeListeners: (() => void) | null = null;
  private paintedInitial = false;

  constructor() {
    effect(() => {
      const triggerInput = this.hoverTrigger();
      const disableOnMobile = this.disableOnMobile();
      this.windowSize.width();

      this.removeListeners?.();
      this.removeListeners = null;

      if (isMobileDisabled(springsConfig.disableOnMobile.hover || disableOnMobile)) {
        return;
      }

      const node = this.resolveTrigger(triggerInput);
      if (!node) return;

      const handleMouseEnter = () => this.hovered.set(true);
      const handleMouseLeave = () => this.hovered.set(false);
      node.addEventListener('mouseenter', handleMouseEnter);
      node.addEventListener('mouseleave', handleMouseLeave);
      this.removeListeners = () => {
        node.removeEventListener('mouseenter', handleMouseEnter);
        node.removeEventListener('mouseleave', handleMouseLeave);
      };
    });

    // Host-level hover fallback (used only when there is no external trigger).
    this.renderer.listen(this.el.nativeElement, 'mouseenter', () => {
      if (isMobileDisabled(springsConfig.disableOnMobile.hover || this.disableOnMobile())) return;
      if (this.resolveTrigger(this.hoverTrigger())) return;
      this.hovered.set(true);
    });
    this.renderer.listen(this.el.nativeElement, 'mouseleave', () => {
      if (isMobileDisabled(springsConfig.disableOnMobile.hover || this.disableOnMobile())) return;
      if (this.resolveTrigger(this.hoverTrigger())) return;
      this.hovered.set(false);
    });

    effect(() => {
      const from = this.from();
      const to = this.to();
      const enabled = this.hoverEnabled();
      const disableOnMobile = this.disableOnMobile();
      const width = this.windowSize.width();
      const config = this.springConfig();
      const delayIn = this.delayIn();
      const delayOut = this.delayOut();
      const immediateOut = this.immediateOut();
      const hydrated = this.hydration.hydrated();
      const hovered = this.hovered();

      if (!this.paintedInitial) {
        this.runner.paintFrom({ from });
        this.paintedInitial = true;
      }
      if (!hydrated) return;

      const active = this.computeActive(enabled, disableOnMobile, width, hovered);
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
    enabled: boolean,
    disableOnMobile: boolean,
    width: number,
    hovered: boolean,
  ): boolean {
    if (isMobileDisabled(springsConfig.disableOnMobile.hover || disableOnMobile, width)) {
      return false;
    }
    if (!enabled) return false;
    return hovered;
  }

  private applyStyles(styles: StyleValues): void {
    for (const key in styles) {
      this.renderer.setStyle(this.el.nativeElement, key, String(styles[key]));
    }
  }

  ngOnDestroy(): void {
    this.removeListeners?.();
    this.runner.destroy();
  }
}
