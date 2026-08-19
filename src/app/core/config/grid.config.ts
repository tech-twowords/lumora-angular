// Port of src/components/common/grid/grid.config.ts
//
// Keep in sync with the `html` media queries in src/styles.css — the formula
// there is: font-size: FONT_BASE * 100 / baseWidth (vw).

/** Root font-size (px) the design is measured against. */
export const FONT_BASE = 16;

export interface GridBreakpoint {
  /** Media-query `max-width` threshold (px). */
  maxWidth: number;
  /** Design base width (px) the range was laid out at. */
  baseWidth: number;
}

/** Breakpoints, largest first. */
export const GRID_BREAKPOINTS: readonly GridBreakpoint[] = [
  { maxWidth: 1920, baseWidth: 1920 },
  { maxWidth: 1440, baseWidth: 1440 },
  { maxWidth: 1024, baseWidth: 1024 },
  { maxWidth: 640, baseWidth: 360 },
];

/** Largest breakpoint width — above it the root font-size scales up. */
export const GRID_BASE_WIDTH = Math.max(...GRID_BREAKPOINTS.map((bp) => bp.maxWidth));
