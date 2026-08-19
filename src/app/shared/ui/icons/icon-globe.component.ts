// Port of the `GlobeIcon` export in src/components/ui/icons.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-globe',
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
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" stroke-width="1.4" />
      <path
        d="M12 2.75c2.6 2.3 4 5.8 4 9.25s-1.4 6.95-4 9.25c-2.6-2.3-4-5.8-4-9.25s1.4-6.95 4-9.25zM2.75 12h18.5"
        stroke="currentColor"
        stroke-width="1.4"
      />
    </svg>
  `,
})
export class IconGlobeComponent {
  readonly title = input<string | undefined>(undefined);
}
