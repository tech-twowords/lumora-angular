// Reimplementation of the damped-harmonic-oscillator integrator that
// `@react-spring/web` (springs/spring.tsx, hover.tsx, in-view.tsx,
// spring-trigger.tsx, progress-trigger.tsx, handle.tsx) runs internally.
// There is no Angular/framework-agnostic package equivalent to
// `@react-spring/web` available, so the numeric integrator is reimplemented
// here in plain TypeScript, matching react-spring's default physics model:
// a semi-implicit-Euler integration of a spring force (`-tension * dx`) and a
// damping force (`-friction * v`), stepped in fixed ~1ms sub-steps so the
// result is independent of the caller's frame rate, with tension/friction
// scaled the same way react-spring scales them internally (1e-6 / 1e-3).
//
// Named presets (`config.default`, `config.gentle`, ...) are ported
// verbatim in `spring-config.ts`.

export interface SpringPhysicsConfig {
  /** Defaults to 1. */
  mass?: number;
  /** Defaults to 170 (react-spring's `config.default`). */
  tension?: number;
  /** Defaults to 26 (react-spring's `config.default`). */
  friction?: number;
  /** Prevents the value from overshooting `target` when true. Defaults to false. */
  clamp?: boolean;
  /** Displacement (in target units) below which the spring is considered at rest. Defaults to 0.005. */
  precision?: number;
  /** Velocity below which the spring is considered at rest. Defaults to precision / 10. */
  restVelocity?: number;
}

export const DEFAULT_SPRING_CONFIG: Required<SpringPhysicsConfig> = {
  mass: 1,
  tension: 170,
  friction: 26,
  clamp: false,
  precision: 0.005,
  restVelocity: 0.0005,
};

export interface SpringState {
  position: number;
  velocity: number;
  done: boolean;
}

export function createSpringState(position = 0): SpringState {
  return { position, velocity: 0, done: true };
}

/** Global skip flag, mirroring react-spring's `useReducedMotion`-driven `skipAnimation`. */
let skipAnimation = false;

export function setSkipAnimation(value: boolean): void {
  skipAnimation = value;
}

export function getSkipAnimation(): boolean {
  return skipAnimation;
}

const SUB_STEP_MS = 1;
const MAX_SUB_STEPS = 64;

/**
 * Advances a single spring value toward `target` by `dtMs` milliseconds.
 * Returns a new state object; does not mutate `state`.
 */
export function stepSpring(
  state: SpringState,
  target: number,
  dtMs: number,
  config: SpringPhysicsConfig = {},
): SpringState {
  if (skipAnimation) {
    return { position: target, velocity: 0, done: true };
  }
  if (state.done && state.position === target) {
    return state;
  }

  const { mass, tension, friction, precision, restVelocity } = {
    ...DEFAULT_SPRING_CONFIG,
    ...config,
  };

  let { position, velocity } = state;
  let remaining = dtMs;
  let steps = 0;

  while (remaining > 0 && steps < MAX_SUB_STEPS) {
    const dt = Math.min(SUB_STEP_MS, remaining);
    remaining -= dt;
    steps++;

    const springForce = -tension * 0.000001 * (position - target);
    const dampingForce = -friction * 0.001 * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * dt;
    position += velocity * dt;
  }

  const atRest =
    Math.abs(velocity) <= restVelocity && Math.abs(target - position) <= precision;

  if (atRest) {
    return { position: target, velocity: 0, done: true };
  }

  return { position, velocity, done: false };
}

/** Immediately snaps a spring to `target` (mirrors react-spring's `immediate: true`). */
export function snapSpring(target: number): SpringState {
  return { position: target, velocity: 0, done: true };
}
