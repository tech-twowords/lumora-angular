// Port of src/hooks/smooth-scroll/use-scroll.ts and src/layouts/scroll-layout.tsx
//
// Owns the single Lenis smooth-scroll instance for the app. Replicates the
// zustand `useScroll` store's `isEnableScroll` on/off semantics (renamed
// `start`/`stop`), plus the `enableNativeScroll` html-locking behavior that
// `ScrollController` in scroll-layout.tsx applied whenever scroll is
// disabled (e.g. while a modal/nav overlay is open).
import { Injectable, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Lenis from 'lenis';

@Injectable({ providedIn: 'root' })
export class ScrollService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** The live Lenis instance, or null before init / after destroy. */
  private lenisInstance: Lenis | null = null;

  /** Mirrors `isEnableScroll` from the reference zustand store. */
  readonly isEnableScroll = signal(true);

  private rafId = 0;
  private initialized = false;

  /**
   * Creates the Lenis instance and starts the rAF loop driving it. Safe to
   * call once (e.g. from an app initializer / root component); no-ops on
   * the server and on repeat calls.
   *
   * TODO: migrate to shared TickerService once core/animation/ticker.service.ts lands.
   */
  init(): void {
    if (!this.isBrowser || this.initialized) return;
    this.initialized = true;

    window.scrollTo(0, 0);

    const lenis = new Lenis({
      smoothWheel: true,
    });
    (window as typeof window & { lenis: Lenis }).lenis = lenis;
    this.lenisInstance = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      this.rafId = requestAnimationFrame(raf);
    };
    this.rafId = requestAnimationFrame(raf);

    // Reflect current isEnableScroll state onto the freshly created instance.
    if (this.isEnableScroll()) {
      lenis.start();
      enableNativeScroll(true);
    } else {
      lenis.stop();
      enableNativeScroll(false);
    }
  }

  /** The live Lenis instance, or null before init(). */
  get lenis(): Lenis | null {
    return this.lenisInstance;
  }

  /** Matches `useScroll().start()` — re-enables Lenis + native scroll. */
  start(): void {
    this.isEnableScroll.set(true);
    this.lenisInstance?.start();
    enableNativeScroll(true);
  }

  /** Matches `useScroll().stop()` — disables Lenis + locks native scroll. */
  stop(): void {
    this.isEnableScroll.set(false);
    this.lenisInstance?.stop();
    enableNativeScroll(false);
  }

  /**
   * Port of src/utils/scroll-to.ts. Smooth-scrolls to an element id or a
   * numeric/px position, temporarily disabling scroll state during the
   * animation the same way the reference does (only when it was already
   * enabled), then re-enabling it shortly after.
   */
  scrollTo(id?: string | number, immediate?: boolean): void {
    if (!this.isBrowser) return;
    const wasEnabled = this.isEnableScroll();

    if (typeof id === 'string') {
      const el = document.getElementById(id);
      if (!el) return;

      if (wasEnabled) {
        this.isEnableScroll.set(false);
      }

      setTimeout(() => {
        window.scrollTo({
          top: getDistanceFromTop(el),
          behavior: immediate ? 'instant' : 'smooth',
        });
      }, 50);
    } else {
      setTimeout(() => {
        window.scrollTo({
          top: Number(id) || 0,
          behavior: immediate ? 'instant' : 'smooth',
        });
      }, 50);
    }

    if (wasEnabled) {
      setTimeout(() => {
        this.isEnableScroll.set(true);
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lenisInstance?.destroy();
    this.lenisInstance = null;
  }
}

function getDistanceFromTop(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return rect.top + scrollTop;
}

function enableNativeScroll(value: boolean): void {
  if (typeof document === 'undefined') return;
  const html = document.querySelector('html');
  if (!html) return;
  if (!value) {
    html.style.position = 'relative';
    html.style.overflow = 'hidden';
    html.style.height = '100%';
  } else {
    html.style.removeProperty('position');
    html.style.removeProperty('overflow');
    html.style.removeProperty('height');
  }
}
