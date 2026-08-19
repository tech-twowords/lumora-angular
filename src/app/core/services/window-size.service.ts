// Port of src/hooks/use-window-size.ts
//
// One debounced `resize` listener shared by every consumer, instead of one
// listener + one debounce timer per hook call. React's version ref-counts
// the listener across component mounts via `useSyncExternalStore`; an
// Angular `providedIn: 'root'` service is already a single app-wide
// instance, so the listener is simply attached once in the constructor —
// same "one shared store" outcome without needing the subscribe/unsubscribe
// bookkeeping the React version needed to survive component unmounts.
import { Injectable, computed, signal } from '@angular/core';

const DEBOUNCE_MS = 300;

interface WindowSize {
  width: number;
  height: number;
}

const SERVER_SNAPSHOT: WindowSize = { width: 0, height: 0 };

function measure(): WindowSize {
  return typeof window !== 'undefined'
    ? { width: window.innerWidth, height: window.innerHeight }
    : SERVER_SNAPSHOT;
}

@Injectable({ providedIn: 'root' })
export class WindowSizeService {
  private readonly size = signal<WindowSize>(measure());
  private debounceId: ReturnType<typeof setTimeout> | undefined;

  readonly width = computed(() => this.size().width);
  readonly height = computed(() => this.size().height);

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  private readonly handleResize = (): void => {
    if (this.debounceId) clearTimeout(this.debounceId);
    this.debounceId = setTimeout(this.publish, DEBOUNCE_MS);
  };

  private readonly publish = (): void => {
    const next = measure();
    const current = this.size();
    if (next.width === current.width && next.height === current.height) return;
    this.size.set(next);
  };
}
