// Port of the `XIcon` export in src/components/ui/icons.tsx
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-x',
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
      <path d="M4 4l16 16M20 4 4 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  `,
})
export class IconXComponent {
  readonly title = input<string | undefined>(undefined);
}
