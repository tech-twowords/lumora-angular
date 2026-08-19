// Port of src/components/common/nav-menu.tsx
//
// Full-screen navigation overlay opened by the header Menu button. Routes
// Contact to the request modal, and smooth-scrolls to in-page sections.
//
// The reference mounts/unmounts via react-spring's `useTransition` (opacity
// 0 <-> 1, tension 280 / friction 32) and has no exposed "spring settled"
// event, so — like page-loader.component.ts — the fade is stepped directly
// against the shared spring integrator on the TickerService, unmounting the
// overlay (`visible.set(false)`) only once the fade-out spring is done.
//
// `homeContent.brand` / `homeContent.nav` / `homeContent.meta.statusLabel`
// (src/data/mocks/home.ts) are not part of this phase's scope (the content
// data layer lands with the home page sections), so they surface here as
// inputs with the reference's literal default copy; a later phase should
// bind them to the real site content.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NavMenuService } from '../../../core/services/nav-menu.service';
import { RequestModalService } from '../../../core/services/request-modal.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { ClockService } from '../../../core/services/clock.service';
import { TickerService } from '../../../core/animation/ticker.service';
import { createSpringState, stepSpring, type SpringState } from '../../../core/animation/spring-physics';
import { LogoMarkComponent } from '../../ui/logo-mark/logo-mark.component';
import { IconXComponent } from '../../ui/icons/icon-x.component';

export interface NavMenuLink {
  label: string;
  href: string;
}

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [LogoMarkComponent, IconXComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-menu.component.html',
})
export class NavMenuComponent {
  private readonly navMenu = inject(NavMenuService);
  private readonly requestModal = inject(RequestModalService);
  private readonly scroll = inject(ScrollService);
  private readonly clock = inject(ClockService);
  private readonly ticker = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  /** See file header note — reference default is `homeContent.brand`. */
  readonly brand = input('Lumora');
  /** See file header note — reference default is `homeContent.nav`. */
  readonly navLinks = input<NavMenuLink[]>([]);
  /** See file header note — reference default is `homeContent.meta.statusLabel`. */
  readonly statusLabel = input('Local time');

  protected readonly visible = signal(false);
  protected readonly opacity = signal(0);
  protected readonly entered = signal(false);

  protected readonly clockLabel = computed(() =>
    this.clock.ready() ? `${this.statusLabel()} — ${this.clock.time()}` : this.statusLabel(),
  );

  private opacityState: SpringState = createSpringState(0);
  private opacityTarget = 0;
  private lastTickTime: number | null = null;
  private unsubscribeTicker: (() => void) | null = null;

  constructor() {
    effect((onCleanup) => {
      const open = this.navMenu.open();
      if (!open) return;

      this.visible.set(true);
      this.scroll.stop();
      this.retargetOpacity(1);

      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') this.navMenu.closeMenu();
      };
      window.addEventListener('keydown', onKey);
      const raf = requestAnimationFrame(() => this.entered.set(true));

      onCleanup(() => {
        window.removeEventListener('keydown', onKey);
        cancelAnimationFrame(raf);
        this.entered.set(false);
        this.scroll.start();
        this.retargetOpacity(0);
      });
    });

    this.destroyRef.onDestroy(() => this.unsubscribeTicker?.());
  }

  protected closeMenu(): void {
    this.navMenu.closeMenu();
  }

  protected handleNav(href: string): void {
    this.navMenu.closeMenu();
    if (href === '#contact') {
      this.requestModal.openModal();
      return;
    }
    this.scroll.scrollTo(href.replace('#', ''));
  }

  protected startProject(): void {
    this.navMenu.closeMenu();
    this.requestModal.openModal();
  }

  private retargetOpacity(target: number): void {
    this.opacityTarget = target;
    this.lastTickTime = null;
    if (this.unsubscribeTicker) return;
    this.unsubscribeTicker = this.ticker.subscribe(
      (time) => this.tickOpacity(time),
      () => 0,
    );
  }

  private tickOpacity(time: number): void {
    const dt = this.lastTickTime === null ? 16 : Math.min(time - this.lastTickTime, 64);
    this.lastTickTime = time;
    this.opacityState = stepSpring(this.opacityState, this.opacityTarget, dt, {
      tension: 280,
      friction: 32,
    });
    this.opacity.set(this.opacityState.position);
    if (this.opacityState.done) {
      this.unsubscribeTicker?.();
      this.unsubscribeTicker = null;
      if (this.opacityTarget === 0) this.visible.set(false);
    }
  }
}
