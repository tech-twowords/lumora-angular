// Port of src/hooks/animation/use-render-loop.ts and
// src/hooks/animation/use-loop-in-view.ts
//
// `runLoop` subscribes a callback to the shared ticker (mirrors `useLoop`).
// `runLoopInView` wraps it with an IntersectionObserver so the callback only
// runs while `element` is in view, plus 10 trailing frames after it leaves
// (so exit animations/cleanup have a chance to settle) — mirrors
// `useLoopInView`.
import type { TickerService } from './ticker.service';

export interface LoopOptions {
  onMount?: () => void;
  onUnMount?: () => void;
  /** Minimum time (ms) between invocations. Defaults to 100ms. */
  framerate?: number;
}

const DEFAULT_FRAMERATE = 100;

/** Mirrors `useLoop`: subscribes `onRender` to the shared ticker. */
export function runLoop(
  ticker: TickerService,
  onRender: (time: number) => void,
  options: LoopOptions = {},
): () => void {
  options.onMount?.();
  const unsubscribe = ticker.subscribe(
    (time) => onRender(time),
    () => options.framerate ?? DEFAULT_FRAMERATE,
  );
  return () => {
    unsubscribe();
    options.onUnMount?.();
  };
}

/** Mirrors `useLoopInView`: runs `onRender` while `element` is in view (+10 trailing frames). */
export function runLoopInView(
  ticker: TickerService,
  element: Element | null,
  onRender: (time: number) => void,
  options: LoopOptions = {},
): () => void {
  const isInView = { current: false };
  const renderCount = { current: 0 };
  const shouldRender = { current: true };

  let observer: IntersectionObserver | null = null;
  if (element) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (isInView.current !== entry.isIntersecting) {
          if (!entry.isIntersecting) {
            renderCount.current = 0;
            shouldRender.current = true;
          }
        }
        isInView.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(element);
    renderCount.current = 0;
    shouldRender.current = true;
  }

  const stopLoop = runLoop(
    ticker,
    (time) => {
      if (isInView.current || shouldRender.current) {
        onRender(time);
        if (!isInView.current) {
          renderCount.current++;
          if (renderCount.current >= 10) {
            shouldRender.current = false;
          }
        }
      }
    },
    options,
  );

  return () => {
    observer?.disconnect();
    stopLoop();
  };
}
