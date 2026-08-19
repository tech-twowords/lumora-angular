// Port of src/components/ui/eyebrow.tsx
//
// Small section label with a leading dot — e.g. "• Creative Agency". The
// reference lets callers pick the rendered tag via an `as` prop; Angular has
// no dynamic-tag-name template construct, so this exposes the same `as` input
// but only the "p" (default) / other cases share one template via `@switch`
// on the handful of tags actually used in the reference call sites.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type EyebrowTag = 'p' | 'span' | 'div' | 'h2' | 'h3';

@Component({
  selector: 'app-eyebrow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (tag()) {
      @case ('span') {
        <span [class]="rootClass()">
          <span aria-hidden [class]="dotClass()"></span>
          <ng-content />
        </span>
      }
      @case ('div') {
        <div [class]="rootClass()">
          <span aria-hidden [class]="dotClass()"></span>
          <ng-content />
        </div>
      }
      @case ('h2') {
        <h2 [class]="rootClass()">
          <span aria-hidden [class]="dotClass()"></span>
          <ng-content />
        </h2>
      }
      @case ('h3') {
        <h3 [class]="rootClass()">
          <span aria-hidden [class]="dotClass()"></span>
          <ng-content />
        </h3>
      }
      @default {
        <p [class]="rootClass()">
          <span aria-hidden [class]="dotClass()"></span>
          <ng-content />
        </p>
      }
    }
  `,
})
export class EyebrowComponent {
  /** Semantic element to render. Defaults to a paragraph. */
  readonly as = input<EyebrowTag>('p');
  /** `light` reads on dark surfaces; `dark` (default) reads on light surfaces. */
  readonly tone = input<'light' | 'dark'>('dark');
  readonly className = input('', { alias: 'class' });

  // `as` is a reserved word in Angular template expressions (the `as` alias
  // pipe), so the template reads the tag through this alias instead of
  // calling `as()` directly.
  protected readonly tag = computed(() => this.as());

  protected readonly rootClass = computed(
    () =>
      `inline-flex items-center gap-2 text-sm font-medium ${
        this.tone() === 'light' ? 'text-white/70' : 'text-foreground/70'
      } ${this.className()}`,
  );

  protected readonly dotClass = computed(
    () => `size-1.5 rounded-pill ${this.tone() === 'light' ? 'bg-white/60' : 'bg-foreground/50'}`,
  );
}
