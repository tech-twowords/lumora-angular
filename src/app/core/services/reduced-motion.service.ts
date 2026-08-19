// Port of src/components/common/reduced-motion.tsx
//
// The reference component calls react-spring's `useReducedMotion()`, which
// watches the `prefers-reduced-motion` media query and toggles react-spring's
// global `skipAnimation` flag so every spring (and spring-text-engine, which
// runs on react-spring) jumps straight to its end state instead of
// animating. There is no React tree to "mount once at the app root" in
// Angular, so this is a root-provided singleton service instead of a
// render-nothing component; construct it once (e.g. inject it in `App`) to
// get the same "mount once" semantics.
import { Injectable, signal } from '@angular/core';
import { setSkipAnimation } from '../animation/spring-physics';

@Injectable({ providedIn: 'root' })
export class ReducedMotionService {
  readonly reducedMotion = signal(false);

  constructor() {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      this.reducedMotion.set(mql.matches);
      setSkipAnimation(mql.matches);
    };
    update();
    mql.addEventListener('change', update);
  }
}
