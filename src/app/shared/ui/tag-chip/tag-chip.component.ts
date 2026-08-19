// Port of src/components/ui/tag-chip.tsx
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-tag-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="rootClass()">
      <ng-content />
    </span>
  `,
})
export class TagChipComponent {
  /** Light chips read on dark surfaces; default reads on light surfaces. */
  readonly tone = input<'light' | 'dark'>('dark');
  readonly className = input('', { alias: 'class' });

  protected readonly rootClass = computed(() => {
    const toneClass =
      this.tone() === 'light' ? 'border-white/25 text-white' : 'border-line text-foreground';
    return `inline-flex items-center rounded-pill border px-4 py-2 text-sm ${toneClass} ${this.className()}`;
  });
}
