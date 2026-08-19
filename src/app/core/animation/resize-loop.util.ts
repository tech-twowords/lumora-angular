// Port of src/hooks/animation/user-resize-loop.ts
//
// Runs `onResize` on the shared ticker whenever `window.innerWidth` changes
// between ticks. Not used by the core Spring/Hover/Inview directives
// themselves (they read width via `WindowSizeService`'s debounced resize
// listener, ported from use-window-size.ts) — this lower-level, tick-driven
// variant exists for later phases that port hooks depending on it (e.g.
// use-adaptive-grid.ts in the reference app).
import type { TickerService } from './ticker.service';
import { runLoop, type LoopOptions } from './loop-in-view.util';

export function runResizeLoop(
  ticker: TickerService,
  onResize: (time: number) => void,
  options?: LoopOptions,
): () => void {
  const width = { current: 0 };
  return runLoop(
    ticker,
    (time) => {
      if (typeof window === 'undefined') return;
      if (width.current !== window.innerWidth) {
        onResize(time);
        width.current = window.innerWidth;
      }
    },
    options,
  );
}
