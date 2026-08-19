// Port of the `ArrowRightIcon` export in src/components/ui/icons.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-arrow-right',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      [attr.aria-hidden]="title() ? null : true"
      [attr.role]="title() ? 'img' : null"
    >
      @if (title()) {
        <title>{{ title() }}</title>
      }
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class IconArrowRightComponent {
  readonly title = input<string | undefined>(undefined);
}
