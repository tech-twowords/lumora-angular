// Port of src/components/common/Cookie/CookieButton.tsx
//
// Cookie-scoped button primitive. Two variants matching the project's
// white/dark surfaces. Hover states snap (no CSS transitions here either —
// this project's real motion goes through the spring directives/engine).
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type CookieButtonVariant = 'primary' | 'secondary';

const base =
  'rounded-lg px-4 py-2 text-sm font-medium leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground';

const variants: Record<CookieButtonVariant, string> = {
  primary: 'bg-foreground text-background hover:opacity-90',
  secondary: 'border border-foreground/15 bg-transparent text-foreground hover:bg-foreground/5',
};

@Component({
  selector: 'app-cookie-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="clicked.emit()" [class]="classes()">
      <ng-content />
    </button>
  `,
})
export class CookieButtonComponent {
  readonly variant = input<CookieButtonVariant>('primary');
  readonly clicked = output<void>();

  protected readonly classes = computed(() => `${base} ${variants[this.variant()]}`);
}
