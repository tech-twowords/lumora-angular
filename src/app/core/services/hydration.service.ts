// Port of src/hooks/use-hydrated.ts
//
// The reference hook exists to avoid a Next.js SSR/CSR hydration mismatch:
// react-spring serializes a SpringValue's initial style differently on the
// server than the client's raw pre-animation read, so components render the
// plain `from` object until this flips true, keeping the server and first
// client paint byte-identical.
//
// This Angular app is client-rendered only (no server-rendered HTML to
// mismatch against), so no consumer in this codebase strictly needs to gate
// on it. It is still ported, for API parity, in case a later phase adds
// Angular SSR/hydration — `hydrated()` becomes `true` on the first render
// after bootstrap via `afterNextRender`, which is the Angular-native,
// SSR-safe equivalent of "mounted on the client".
import { Injectable, signal } from '@angular/core';
import { afterNextRender } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HydrationService {
  private readonly hydratedSignal = signal(false);
  readonly hydrated = this.hydratedSignal.asReadonly();

  constructor() {
    afterNextRender(() => this.hydratedSignal.set(true));
  }
}
