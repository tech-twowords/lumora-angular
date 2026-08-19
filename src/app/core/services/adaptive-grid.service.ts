// Port of src/hooks/use-adaptive-grid.ts and src/components/common/grid/adaptive-grid.tsx
//
// Scales the root (<html>) font-size up while the viewport is wider than
// `baseWidth`, so a rem-based layout keeps growing proportionally on large
// displays. At or below `baseWidth` the inline font-size is cleared and the
// `vw` media queries in styles.css take over. Render-nothing in the
// reference (mounted once near the app root) — here a root-provided
// singleton service; construct it once (e.g. inject it in AppComponent) to
// get the same "mount once" semantics.
import { Injectable, inject } from '@angular/core';
import { TickerService } from '../animation/ticker.service';
import { runResizeLoop } from '../animation/resize-loop.util';
import { FONT_BASE, GRID_BASE_WIDTH } from '../config/grid.config';

export interface AdaptiveGridOptions {
  /** Viewport width (px) above which the root font-size scales up. */
  baseWidth?: number;
  /** Damping factor (0-1) for the scale-up; 1 = fully proportional. */
  coef?: number;
}

/**
 * Interpolates a font-size for `windowWidth` relative to `baseWidth`. `coef`
 * damps the effect: at 1 the size tracks the viewport 1:1, at 0 it stays flat.
 */
export function interpolateFontSize(
  baseFontSize: number,
  baseWidth: number,
  windowWidth: number,
  coef = 0.5,
): number {
  const widthReduction = ((baseWidth - windowWidth) / baseWidth) * 100;
  const fontReduction = widthReduction * coef;
  return baseFontSize - (baseFontSize * fontReduction) / 100;
}

@Injectable({ providedIn: 'root' })
export class AdaptiveGridService {
  private readonly ticker = inject(TickerService);
  private started = false;

  /** Idempotent — safe to call from multiple root-level consumers. */
  start(options: AdaptiveGridOptions = {}): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    const baseWidth = options.baseWidth ?? GRID_BASE_WIDTH;
    const coef = options.coef ?? 0.6666;

    const apply = () => {
      const root = document.documentElement;
      const size = interpolateFontSize(FONT_BASE, baseWidth, window.innerWidth, coef);

      if (size > FONT_BASE) {
        root.style.setProperty('font-size', `${size}px`);
      } else {
        root.style.removeProperty('font-size');
      }
    };

    apply();
    runResizeLoop(this.ticker, apply);
  }
}
