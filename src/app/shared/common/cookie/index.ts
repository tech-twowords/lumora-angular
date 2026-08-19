// Barrel. Port of src/components/common/Cookie/index.ts
export { CookieComponent } from './cookie.component';
export { CookieLazyComponent } from './cookie-lazy.component';
export { CookieBannerComponent } from './cookie-banner.component';
export { CookieButtonComponent } from './cookie-button.component';
export { CookiePreferencesModalComponent } from './cookie-preferences-modal.component';
export { CookieToggleComponent } from './cookie-toggle.component';
// CookieStoreService already ported at core/services/cookie-store.service.ts
// (was src/components/common/Cookie/cookieStore.ts) — re-exported here too
// for import-path convenience matching the reference barrel.
export { CookieStoreService, type CookieConsent } from '../../../core/services/cookie-store.service';
