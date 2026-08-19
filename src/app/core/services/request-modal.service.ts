// Port of the `useRequestModal` store in src/hooks/ui-store.ts
//
// The "Start a project" request modal open/close state.
import { Injectable, Signal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RequestModalService {
  private readonly _open = signal(false);

  readonly open: Signal<boolean> = this._open.asReadonly();

  openModal(): void {
    this._open.set(true);
  }

  closeModal(): void {
    this._open.set(false);
  }
}
