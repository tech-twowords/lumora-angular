// Port of src/components/common/Cookie/CookiePreferencesModal.tsx
//
// Spring-driven mount/unmount (opacity + scale, tension 320 / friction 32),
// stepped against the shared TickerService — see nav-menu.component.ts for
// the same pattern and rationale.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CookieStoreService } from '../../../core/services/cookie-store.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { TickerService } from '../../../core/animation/ticker.service';
import { createSpringState, stepSpring, type SpringState } from '../../../core/animation/spring-physics';
import { CookieButtonComponent } from './cookie-button.component';
import { CookieToggleComponent } from './cookie-toggle.component';

type CategoryKey = 'necessary' | 'analytics' | 'marketing';

interface Category {
  key: CategoryKey;
  title: string;
  body: string;
  required?: boolean;
}

const CATEGORIES: Category[] = [
  {
    key: 'necessary',
    title: 'Strictly necessary',
    body: "Required for the site to work — sign-in, security, page navigation. These can't be turned off.",
    required: true,
  },
  {
    key: 'analytics',
    title: 'Analytics',
    body: 'Anonymised usage stats so we know which pages help and which fall flat. No personal profile is built.',
  },
  {
    key: 'marketing',
    title: 'Marketing',
    body: "Lets us measure ad performance and re-show content you didn't get to finish reading. Opt out anytime.",
  },
];

const TITLE_ID = 'cookie-preferences-title';

@Component({
  selector: 'app-cookie-preferences-modal',
  standalone: true,
  imports: [CookieButtonComponent, CookieToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cookie-preferences-modal.component.html',
})
export class CookiePreferencesModalComponent {
  private readonly store = inject(CookieStoreService);
  private readonly scroll = inject(ScrollService);
  private readonly ticker = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly titleId = TITLE_ID;
  protected readonly categories = CATEGORIES;

  // Pre-fill toggles as ON when no prior decision exists. Once a user has
  // saved a choice, that choice wins. Re-seeded every time the modal opens.
  protected readonly analytics = signal(true);
  protected readonly marketing = signal(true);

  protected readonly visible = signal(false);
  protected readonly opacity = signal(0);
  protected readonly scale = signal(0.94);

  private opacityState: SpringState = createSpringState(0);
  private scaleState: SpringState = createSpringState(0.94);
  private target: 0 | 1 = 0;
  private lastTickTime: number | null = null;
  private unsubscribeTicker: (() => void) | null = null;
  private triggerEl: HTMLElement | null = null;

  constructor() {
    effect((onCleanup) => {
      const open = this.store.modalOpen();

      if (!open) {
        this.retarget(0);
        return;
      }

      this.visible.set(true);
      this.retarget(1);

      // Re-seed local toggles every time the modal opens.
      const consent = this.store.consent();
      this.analytics.set(consent?.analytics ?? true);
      this.marketing.set(consent?.marketing ?? true);

      // ESC closes; lock scroll while open; restore focus to the opener.
      this.triggerEl = document.activeElement as HTMLElement | null;
      this.scroll.stop();

      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') this.closeModal();
      };
      window.addEventListener('keydown', onKey);

      onCleanup(() => {
        window.removeEventListener('keydown', onKey);
        this.scroll.start();
        if (this.triggerEl && typeof this.triggerEl.focus === 'function') {
          this.triggerEl.focus();
        }
      });
    });

    this.destroyRef.onDestroy(() => this.unsubscribeTicker?.());
  }

  protected closeModal(): void {
    this.store.closeModal();
  }

  protected acceptAll(): void {
    this.store.acceptAll();
  }

  protected rejectAll(): void {
    this.store.rejectAll();
  }

  protected handleSave(): void {
    this.store.savePreferences({ analytics: this.analytics(), marketing: this.marketing() });
  }

  protected valueFor(category: Category): boolean {
    if (category.key === 'necessary') return true;
    return category.key === 'analytics' ? this.analytics() : this.marketing();
  }

  protected toggleCategory(category: Category): void {
    if (category.key === 'analytics') this.analytics.update((v) => !v);
    else if (category.key === 'marketing') this.marketing.update((v) => !v);
  }

  private retarget(target: 0 | 1): void {
    this.target = target;
    this.lastTickTime = null;
    if (this.unsubscribeTicker) return;
    this.unsubscribeTicker = this.ticker.subscribe(
      (time) => this.tick(time),
      () => 0,
    );
  }

  private tick(time: number): void {
    const dt = this.lastTickTime === null ? 16 : Math.min(time - this.lastTickTime, 64);
    this.lastTickTime = time;
    const config = { tension: 320, friction: 32 };
    const targetScale = this.target === 1 ? 1 : 0.94;

    this.opacityState = stepSpring(this.opacityState, this.target, dt, config);
    this.scaleState = stepSpring(this.scaleState, targetScale, dt, config);
    this.opacity.set(this.opacityState.position);
    this.scale.set(this.scaleState.position);

    if (this.opacityState.done && this.scaleState.done) {
      this.unsubscribeTicker?.();
      this.unsubscribeTicker = null;
      if (this.target === 0) this.visible.set(false);
    }
  }
}
