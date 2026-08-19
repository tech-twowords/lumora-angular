// Port of src/components/ui/pill-button.tsx
//
// Variant-driven button/link with a scale-on-hover spring and an optional
// circular arrow badge that springs independently. Renders an `<a>` when
// `href` is set, otherwise a `<button>`. The reference's `onClick` prop
// becomes the `buttonClick` output (an Angular component output named
// `onClick` would collide in spirit with the native DOM `click` event).
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HoverDirective } from '../../../core/directives/hover.directive';
import { IconArrowRightComponent } from '../icons/icon-arrow-right.component';
import { IconArrowUpRightComponent } from '../icons/icon-arrow-up-right.component';
import type { StyleValues } from '../../../core/animation/spring-style-runner';

export type PillButtonVariant = 'dark' | 'light' | 'outline';
export type PillButtonArrow = 'right' | 'up-right';

const surfaceByVariant: Record<PillButtonVariant, string> = {
  dark: 'bg-ink text-white',
  light: 'bg-surface text-foreground',
  outline: 'border border-line bg-transparent text-foreground',
};

@Component({
  selector: 'app-pill-button',
  standalone: true,
  imports: [NgTemplateOutlet, HoverDirective, IconArrowRightComponent, IconArrowUpRightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pill-button.component.html',
})
export class PillButtonComponent {
  readonly label = input.required<string>();
  /** Render as a link when set, otherwise a button. */
  readonly href = input<string | undefined>(undefined);
  readonly variant = input<PillButtonVariant>('dark');
  /** Append a circular icon badge that springs on hover. */
  readonly withArrow = input(false);
  readonly arrow = input<PillButtonArrow>('right');
  readonly type = input<'button' | 'submit'>('button');
  readonly className = input('', { alias: 'class' });

  readonly buttonClick = output<void>();

  protected readonly hoverScaleConfig = { tension: 320, friction: 18 };
  protected readonly hoverBadgeConfig = { tension: 320, friction: 18 };
  protected readonly scaleFrom: StyleValues = { transform: 'scale(1)' };
  protected readonly scaleTo: StyleValues = { transform: 'scale(1.04)' };
  protected readonly badgeFrom: StyleValues = { transform: 'translate(0px, 0px)' };

  protected readonly badgeTo = computed<StyleValues>(() => ({
    transform: this.arrow() === 'up-right' ? 'translate(2px, -2px)' : 'translate(3px, 0px)',
  }));

  protected readonly contentClass = computed(() => {
    const padding = this.withArrow() ? 'py-1.5 pl-6 pr-1.5' : 'px-7 py-3.5';
    return `inline-flex items-center gap-3 rounded-pill text-sm font-medium ${surfaceByVariant[this.variant()]} ${padding}`;
  });

  protected readonly badgeClass = computed(() => {
    const badgeColors = this.variant() === 'dark' ? 'bg-white text-ink' : 'bg-ink text-white';
    return `grid size-9 place-items-center rounded-pill text-base ${badgeColors}`;
  });

  protected readonly rootClass = computed(
    () =>
      `inline-block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${this.className()}`,
  );

  protected onButtonClick(): void {
    this.buttonClick.emit();
  }
}
