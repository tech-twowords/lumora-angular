// Port of src/components/common/Cookie/cookieStore.ts
//
// Cookie consent state: same consent categories, same localStorage
// persistence key, and same actions (accept all / reject all / save
// preferences / open-close preferences modal) as the reference zustand
// store, expressed as signals.
import { Injectable, PLATFORM_ID, Signal, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'cookie-consent-v1';

export interface CookieConsent {
  /** Strictly necessary — always true, never user-disabled. */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
};

@Injectable({ providedIn: 'root' })
export class CookieStoreService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _consent = signal<CookieConsent | null>(null);
  private readonly _hydrated = signal(false);
  private readonly _modalOpen = signal(false);

  /** null until the user has decided. After hydration, the banner shows iff this is null. */
  readonly consent: Signal<CookieConsent | null> = this._consent.asReadonly();
  /** True once the client has read localStorage — guards against SSR/CSR mismatch. */
  readonly hydrated: Signal<boolean> = this._hydrated.asReadonly();
  readonly modalOpen: Signal<boolean> = this._modalOpen.asReadonly();

  hydrate(): void {
    this._consent.set(this.loadConsent());
    this._hydrated.set(true);
  }

  acceptAll(): void {
    // Matches the reference implementation exactly: despite the name,
    // `acceptAll` persists analytics/marketing as false (necessary only).
    const next: CookieConsent = { necessary: true, analytics: false, marketing: false };
    this.saveConsent(next);
    this._consent.set(next);
    this._modalOpen.set(false);
  }

  rejectAll(): void {
    const next: CookieConsent = { ...DEFAULT_CONSENT };
    this.saveConsent(next);
    this._consent.set(next);
    this._modalOpen.set(false);
  }

  savePreferences(next: { analytics: boolean; marketing: boolean }): void {
    const consent: CookieConsent = { necessary: true, ...next };
    this.saveConsent(consent);
    this._consent.set(consent);
    this._modalOpen.set(false);
  }

  openModal(): void {
    this._modalOpen.set(true);
  }

  closeModal(): void {
    this._modalOpen.set(false);
  }

  private loadConsent(): CookieConsent | null {
    if (!this.isBrowser) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<CookieConsent>;
      return { ...DEFAULT_CONSENT, ...parsed, necessary: true };
    } catch {
      return null;
    }
  }

  private saveConsent(consent: CookieConsent): void {
    if (!this.isBrowser) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      /* ignore storage failures (private mode, quota) */
    }
  }
}
