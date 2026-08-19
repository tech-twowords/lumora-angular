// Port of src/lib/animation/ticker.ts
//
// A single, app-wide `requestAnimationFrame` loop. Every animation consumer
// that needs per-frame work subscribes here instead of starting its own rAF,
// so a page with N scroll-driven directives runs one loop, not N.
//
// The loop is reference-counted: it starts on the first subscriber and stops
// (`cancelAnimationFrame`) when the last one leaves, so an idle page costs
// nothing. Each subscriber is throttled independently by its own framerate.
//
// This app is zoneless (no zone.js in dependencies, no NgZone provider in
// app.config.ts) so, unlike an NgZone app, there is no need to run the rAF
// loop "outside Angular" to avoid spurious change detection — signal writes
// made from `callback` already schedule change detection precisely where
// needed under zoneless CD. If zone.js is ever reintroduced, wrap the
// `requestAnimationFrame` calls below in `NgZone.runOutsideAngular`.
import { Injectable } from '@angular/core';

export type TickerCallback = (time: number) => void;

interface Subscriber {
  callback: TickerCallback;
  /** Read live each frame so framerate changes take effect. */
  getFramerate: () => number;
  /** Timestamp of this subscriber's last invocation. */
  last: number;
}

@Injectable({ providedIn: 'root' })
export class TickerService {
  private readonly subscribers = new Set<Subscriber>();
  private rafId: number | null = null;

  private readonly frame = (time: number): void => {
    // Snapshot first: a callback may subscribe/unsubscribe during iteration.
    for (const sub of [...this.subscribers]) {
      if (!this.subscribers.has(sub)) continue;
      if (time - sub.last <= sub.getFramerate()) continue;
      sub.last = time;
      try {
        sub.callback(time);
      } catch (error) {
        // Isolate failures — one bad subscriber must not kill the shared loop.
        console.error('[ticker] subscriber threw:', error);
      }
    }
    this.rafId = requestAnimationFrame(this.frame);
  };

  private start(): void {
    if (this.rafId === null) this.rafId = requestAnimationFrame(this.frame);
  }

  private stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Subscribe a callback to the shared rAF loop.
   *
   * @param callback - invoked with the rAF timestamp, no more often than `getFramerate()` ms apart.
   * @param getFramerate - returns the current minimum gap (ms) between invocations; read live every frame.
   * @returns an unsubscribe function.
   */
  subscribe(callback: TickerCallback, getFramerate: () => number): () => void {
    const subscriber: Subscriber = {
      callback,
      getFramerate,
      last: typeof performance !== 'undefined' ? performance.now() : 0,
    };
    this.subscribers.add(subscriber);
    this.start();

    return () => {
      this.subscribers.delete(subscriber);
      if (this.subscribers.size === 0) this.stop();
    };
  }
}
