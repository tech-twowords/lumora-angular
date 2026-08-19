// Port of src/components/common/liquid-reveal.tsx
//
// Full-bleed "before / after" image with a liquid cursor-reveal. `before` is
// always shown; moving the pointer paints a soft brush trail of `after` that
// decays over time. Canvas work runs on the shared TickerService (the
// reference's `subscribeToTicker` maps directly onto it — same
// single-app-wide-rAF contract). Honours `prefers-reduced-motion` by showing
// only `before`.
//
// The reference uses `next/image fill` for the always-visible base image
// (server-optimized, absolutely positioned, object-cover). There is no
// Next.js Image equivalent here, so this ports it to a plain `<img>` sized
// via `absolute inset-0 h-full w-full object-cover`, with `loading`/
// `fetchpriority` derived from `priority` to approximate the same LCP intent.
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { TickerService } from '../../../core/animation/ticker.service';

@Component({
  selector: 'app-liquid-reveal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './liquid-reveal.component.html',
})
export class LiquidRevealComponent implements AfterViewInit {
  /** Always-visible base image (also the SSR/LCP image). */
  readonly beforeSrc = input.required<string>();
  /** Image revealed along the cursor trail. */
  readonly afterSrc = input.required<string>();
  readonly alt = input.required<string>();
  readonly className = input('', { alias: 'class' });
  /** Brush radius in CSS px. */
  readonly brushRadius = input(90);
  /** Per-frame trail decay (0-1). Higher = the trail fades faster. */
  readonly decay = input(0.016);
  readonly priority = input(true);
  readonly sizes = input('100vw');

  protected readonly loading = computed<'eager' | 'lazy'>(() => (this.priority() ? 'eager' : 'lazy'));
  protected readonly fetchPriority = computed<'high' | 'auto'>(() =>
    this.priority() ? 'high' : 'auto',
  );

  private readonly ticker = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  ngAfterViewInit(): void {
    const container = this.containerRef().nativeElement;
    const canvas = this.canvasRef().nativeElement;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // static `before` image only

    const ctx = canvas.getContext('2d');
    const cover = document.createElement('canvas');
    const coverCtx = cover.getContext('2d');
    const brush = document.createElement('canvas');
    const brushCtx = brush.getContext('2d');
    if (!ctx || !coverCtx || !brushCtx) return;

    const brushRadius = this.brushRadius();
    const decay = this.decay();

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let radius = brushRadius * dpr;
    let ready = false;
    // Frames of inactivity. The trail fades per-frame, so we count frames
    // (not wall-time) to guarantee a full fade-then-clear regardless of
    // frame rate.
    let idle = 0;
    // Once the pointer stops we accelerate the fade (see `tick`), so the
    // trail is gone well before this many frames — at which point we
    // hard-clear the canvas so no faint, 8-bit-quantised residue can linger.
    const fadeFrames = 120;

    const points: Array<{ x: number; y: number }> = [];
    let last: { x: number; y: number } | null = null;
    const afterImg = new window.Image();

    const drawCover = () => {
      if (!ready) return;
      cover.width = width;
      cover.height = height;
      const imgRatio = afterImg.width / afterImg.height;
      const boxRatio = width / height;
      let dw: number;
      let dh: number;
      if (imgRatio > boxRatio) {
        dh = height;
        dw = height * imgRatio;
      } else {
        dw = width;
        dh = width / imgRatio;
      }
      coverCtx.clearRect(0, 0, width, height);
      coverCtx.drawImage(afterImg, (width - dw) / 2, (height - dh) / 2, dw, dh);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      radius = brushRadius * dpr;
      const diameter = Math.ceil(radius * 2);
      brush.width = diameter;
      brush.height = diameter;
      drawCover();
    };

    const stamp = (x: number, y: number) => {
      const diameter = brush.width;
      const c = diameter / 2;
      brushCtx.clearRect(0, 0, diameter, diameter);
      brushCtx.globalCompositeOperation = 'source-over';
      const gradient = brushCtx.createRadialGradient(c, c, 0, c, c, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.55, 'rgba(255,255,255,0.82)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      brushCtx.fillStyle = gradient;
      brushCtx.fillRect(0, 0, diameter, diameter);
      // Keep only the `after` pixels under the soft brush.
      brushCtx.globalCompositeOperation = 'source-in';
      brushCtx.drawImage(cover, x - c, y - c, diameter, diameter, 0, 0, diameter, diameter);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(brush, x - c, y - c);
    };

    const onMove = (event: PointerEvent) => {
      if (!ready) return;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * dpr;
      const y = (event.clientY - rect.top) * dpr;
      if (x < -radius || y < -radius || x > width + radius || y > height + radius) {
        last = null;
        return;
      }
      if (!last) {
        last = { x, y };
        points.push({ x, y });
        return;
      }
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      const step = Math.max(radius * 0.3, 1);
      const n = Math.min(Math.ceil(dist / step), 60);
      for (let i = 1; i <= n; i += 1) {
        points.push({ x: last.x + (dx * i) / n, y: last.y + (dy * i) / n });
      }
      last = { x, y };
    };

    const tick = () => {
      if (!ready || width === 0) return;
      const drawing = points.length > 0;
      if (drawing) {
        idle = 0;
      } else {
        if (idle > fadeFrames) return; // fully faded & cleared — idle, no work
        idle += 1;
      }
      // While drawing, fade gently for a long trail. Once the pointer stops,
      // ramp the fade up each idle frame so the trail dissolves completely
      // rather than leaving a faint residue that never reaches zero alpha.
      const fade = drawing ? decay : Math.min(decay + idle * 0.004, 0.5);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, width, height);
      if (drawing) {
        for (const point of points) stamp(point.x, point.y);
        points.length = 0;
      } else if (idle >= fadeFrames) {
        ctx.clearRect(0, 0, width, height); // guarantee a clean slate
      }
    };

    afterImg.decoding = 'async';
    afterImg.onload = () => {
      ready = true;
      resize();
    };
    afterImg.src = this.afterSrc();

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener('pointermove', onMove, { passive: true });
    const unsubscribe = this.ticker.subscribe(tick, () => 0);

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      unsubscribe();
    });
  }
}
