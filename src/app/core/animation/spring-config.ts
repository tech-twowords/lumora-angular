// Port of src/lib/springs/config.ts (`springsConfig` / `isMobileDisabled`),
// plus react-spring's named spring presets (the `config` export from
// `@react-spring/web`, referenced in the reference app as `config.default`,
// `config.gentle`, etc. — e.g. handle.tsx's default `config = _config.gentle`
// and progress-trigger.tsx's default `config = config.default`). Ported
// verbatim (same names, same tension/friction numbers).
import type { SpringPhysicsConfig } from './spring-physics';

interface SpringsBehaviorConfig {
  mobileWidth: number;
  disableOnMobile: {
    hover: boolean;
    inview: boolean;
    spring: boolean;
    springtrigger: boolean;
  };
}

export const springsConfig: SpringsBehaviorConfig = {
  mobileWidth: 768,
  disableOnMobile: {
    hover: true,
    inview: false,
    spring: false,
    springtrigger: false,
  },
};

/**
 * @param value - whether the animation opts into mobile-disabling
 * @param viewportWidth - optional explicit width (px); pass a tracked value
 *   here so callers re-evaluate on resize. Falls back to `window.innerWidth`.
 */
export function isMobileDisabled(value: boolean, viewportWidth?: number): boolean {
  if (typeof window === 'undefined') return false;
  if (!value) return false;
  const width = viewportWidth && viewportWidth > 0 ? viewportWidth : window.innerWidth;
  return width <= springsConfig.mobileWidth;
}

/** react-spring's built-in named presets (`config.*`), values unchanged. */
export const springPresets: Record<
  'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow' | 'molasses',
  SpringPhysicsConfig
> = {
  default: { tension: 170, friction: 26 },
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 280, friction: 60 },
  molasses: { tension: 280, friction: 120 },
};
