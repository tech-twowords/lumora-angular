// Port of src/components/common/Cookie/LazyCookie.tsx
//
// The reference uses `next/dynamic({ ssr: false })` so the Cookie banner /
// preferences modal / consent store chunk only fetches once this wrapper
// actually mounts on the client, keeping it out of the first-load JS
// manifest. Angular's structural equivalent for "don't ship this in the
// initial bundle, load it after" is a `@defer` block; with no explicit
// trigger it defaults to `on idle`, which is the closest built-in analogue
// to "fetch once the client is free, not blocking first paint." Wire this
// component into the app root in place of a bare `<app-cookie />`.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CookieComponent } from './cookie.component';

@Component({
  selector: 'app-cookie-lazy',
  standalone: true,
  imports: [CookieComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @defer {
      <app-cookie />
    }
  `,
})
export class CookieLazyComponent {}
