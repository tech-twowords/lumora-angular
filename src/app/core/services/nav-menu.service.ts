// Port of the `useNavMenu` store in src/hooks/ui-store.ts
//
// The full-screen navigation overlay open/close state.
import { Injectable, Signal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NavMenuService {
  private readonly _open = signal(false);

  readonly open: Signal<boolean> = this._open.asReadonly();

  openMenu(): void {
    this._open.set(true);
  }

  closeMenu(): void {
    this._open.set(false);
  }

  toggleMenu(): void {
    this._open.update((open) => !open);
  }
}
