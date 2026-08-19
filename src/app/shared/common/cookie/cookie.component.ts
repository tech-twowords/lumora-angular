// Port of src/components/common/Cookie/Cookie.tsx
//
// Mount once at the root shell. Renders the bottom-right banner (until the
// user has decided) and the preferences modal (when the user opens it).
// Hydration runs after first render, same "SSR pass and first client render
// agree on 'not yet decided'" rationale as the reference (see
// core/services/hydration.service.ts for the Angular-native equivalent of
// that concern).
import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { CookieStoreService } from '../../../core/services/cookie-store.service';
import { CookieBannerComponent } from './cookie-banner.component';
import { CookiePreferencesModalComponent } from './cookie-preferences-modal.component';

@Component({
  selector: 'app-cookie',
  standalone: true,
  imports: [CookieBannerComponent, CookiePreferencesModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cookie-banner />
    <app-cookie-preferences-modal />
  `,
})
export class CookieComponent {
  private readonly store = inject(CookieStoreService);

  constructor() {
    afterNextRender(() => this.store.hydrate());
  }
}
