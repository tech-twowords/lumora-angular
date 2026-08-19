// Port of src/components/common/request-modal.tsx
//
// "Start a project" request modal. Opens from any CTA via RequestModalService,
// blurs the whole site behind a backdrop, and posts the lead via
// ContactService (a stub for the reference's `apiFetch("/api/contact", ...)`
// — see core/services/contact.service.ts for the TODO on wiring a real
// backend).
//
// The reference mounts/unmounts via react-spring's `useTransition` (opacity
// + y, tension 260 / friction 30). As in nav-menu.component.ts, the fade/
// slide is stepped directly against the shared spring integrator on the
// TickerService (no "spring settled" event on SpringDirective/HoverDirective
// to hook an unmount off of), unmounting only once both channels are done.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RequestModalService } from '../../../core/services/request-modal.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { ContactService, type ContactRequest } from '../../../core/services/contact.service';
import { TickerService } from '../../../core/animation/ticker.service';
import { createSpringState, stepSpring, type SpringState } from '../../../core/animation/spring-physics';
import { PillButtonComponent } from '../../ui/pill-button/pill-button.component';
import { IconXComponent } from '../../ui/icons/icon-x.component';
import { LogoMarkComponent } from '../../ui/logo-mark/logo-mark.component';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY: ContactRequest = { name: '', email: '', message: '' };

@Component({
  selector: 'app-request-modal',
  standalone: true,
  imports: [PillButtonComponent, IconXComponent, LogoMarkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-modal.component.html',
})
export class RequestModalComponent {
  private readonly requestModal = inject(RequestModalService);
  private readonly scroll = inject(ScrollService);
  private readonly contact = inject(ContactService);
  private readonly ticker = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = signal<ContactRequest>({ ...EMPTY });
  protected readonly status = signal<Status>('idle');
  protected readonly error = signal<string | null>(null);

  protected readonly visible = signal(false);
  protected readonly opacity = signal(0);
  protected readonly y = signal(28);

  private opacityState: SpringState = createSpringState(0);
  private yState: SpringState = createSpringState(28);
  private target: 0 | 1 = 0;
  private lastTickTime: number | null = null;
  private unsubscribeTicker: (() => void) | null = null;

  constructor() {
    // Lock scroll + close on Escape while open, drive the mount transition.
    effect((onCleanup) => {
      const open = this.requestModal.open();
      if (!open) return;

      this.visible.set(true);
      this.scroll.stop();
      this.retarget(1);

      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') this.closeModal();
      };
      window.addEventListener('keydown', onKey);

      onCleanup(() => {
        window.removeEventListener('keydown', onKey);
        this.scroll.start();
        this.retarget(0);
      });
    });

    // Reset the form a moment after the modal closes (so it doesn't flicker mid-exit).
    effect((onCleanup) => {
      const open = this.requestModal.open();
      if (open) return;
      const id = setTimeout(() => {
        this.form.set({ ...EMPTY });
        this.status.set('idle');
        this.error.set(null);
      }, 300);
      onCleanup(() => clearTimeout(id));
    });

    this.destroyRef.onDestroy(() => this.unsubscribeTicker?.());
  }

  protected closeModal(): void {
    this.requestModal.closeModal();
  }

  protected updateField(key: keyof ContactRequest, value: string): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.status() === 'submitting') return;
    this.status.set('submitting');
    this.error.set(null);
    try {
      await this.contact.submit(this.form());
      this.status.set('success');
    } catch (err) {
      this.status.set('error');
      this.error.set(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    }
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
    const config = { tension: 260, friction: 30 };
    const targetY = this.target === 1 ? 0 : 18;

    this.opacityState = stepSpring(this.opacityState, this.target, dt, config);
    this.yState = stepSpring(this.yState, targetY, dt, config);
    this.opacity.set(this.opacityState.position);
    this.y.set(this.yState.position);

    if (this.opacityState.done && this.yState.done) {
      this.unsubscribeTicker?.();
      this.unsubscribeTicker = null;
      if (this.target === 0) this.visible.set(false);
    }
  }
}
