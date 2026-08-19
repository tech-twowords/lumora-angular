// Port of src/components/ui/logo-mark.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo-mark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 48 48"
      fill="none"
      [attr.aria-hidden]="title() ? null : true"
      [attr.role]="title() ? 'img' : null"
    >
      @if (title()) {
        <title>{{ title() }}</title>
      }
      <!-- concave four-point spark drawn from the centre outward -->
      <path
        d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z"
        fill="currentColor"
      />
    </svg>
  `,
})
export class LogoMarkComponent {
  readonly title = input<string | undefined>(undefined);
}
