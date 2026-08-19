// Shared scroll-progress math factored out of
// src/hooks/animation/use-progress-trigger.ts and
// src/hooks/animation/use-spring-trigger.ts, which both computed the exact
// same nine trigger positions and 0-1 progress from an element's
// `getBoundingClientRect()`. Ported verbatim (same formulas), just
// deduplicated into one function shared by ProgressTriggerDirective and
// SpringTriggerDirective.
export type TriggerPos =
  | 'top top'
  | 'center top'
  | 'bottom top'
  | 'top center'
  | 'center center'
  | 'bottom center'
  | 'top bottom'
  | 'center bottom'
  | 'bottom bottom';

/** Computes the 0-1 scroll progress of `element` between `start` and `end` trigger positions. */
export function computeTriggerProgress(
  element: Element,
  start: TriggerPos,
  end: TriggerPos,
): number {
  const bb = element.getBoundingClientRect();
  const clientHeight = window.innerHeight;

  const poses = {
    top_top: bb.top,
    center_top: bb.top + bb.height / 2,
    bottom_top: bb.bottom,
    top_bottom: bb.top - clientHeight,
    center_bottom: bb.top + bb.height / 2 - clientHeight,
    bottom_bottom: bb.bottom - clientHeight,
    top_center: bb.top - clientHeight / 2,
    center_center: bb.top + bb.height / 2 - clientHeight / 2,
    bottom_center: bb.bottom - clientHeight / 2,
  };

  const scrollStart = poses[start.split(' ').join('_') as keyof typeof poses];
  const scrollEnd = poses[end.split(' ').join('_') as keyof typeof poses];
  const length = Math.abs(scrollStart - scrollEnd);
  return Math.min(Math.max(0, 1 - (scrollStart + length) / length), 1);
}
