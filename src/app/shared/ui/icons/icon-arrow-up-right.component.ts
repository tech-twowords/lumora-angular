// Port of the `ArrowUpRightIcon` export in src/components/ui/icons.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-arrow-up-right',
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
        d="M7 17 17 7M8 7h9v9"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class IconArrowUpRightComponent {
  readonly title = input<string | undefined>(undefined);
}
