// Port of the `CircleDotIcon` export in src/components/ui/icons.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-circle-dot',
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
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  `,
})
export class IconCircleDotComponent {
  readonly title = input<string | undefined>(undefined);
}
