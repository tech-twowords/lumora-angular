// Port of the `useIntro` store in src/hooks/ui-store.ts
//
// The intro gate: flipped to `ready` once the page loader finishes its
// exit, so above-the-fold reveal animations wait for it.
import { Injectable, Signal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IntroService {
  private readonly _ready = signal(false);

  /** True once the loader has fully left the screen. */
  readonly ready: Signal<boolean> = this._ready.asReadonly();

  setReady(ready: boolean): void {
    this._ready.set(ready);
  }
}
