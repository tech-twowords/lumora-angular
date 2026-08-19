// Port of src/views/home/stat-counter.tsx
//
// A single stat whose number counts up as the block scrolls toward centre.
// `appProgressTrigger` (port of `ProgressTrigger`/`useProgressTrigger`) drives
// the 0-1 scroll progress; the raw `progress` (not the spring-smoothed
// `interpolatedProgress`) is mapped to the displayed value, matching the
// reference's `onChange={({ progress }) => setValue(...)}`.
//
// Rendered as an `<li>` mapped from `StatsComponent`'s `<ul>`; host is
// `display: contents` so the wrapping `<app-stat-counter>` element does not
// disturb the parent list's grid layout.
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import {
  ProgressTriggerDirective,
  type ProgressTriggerChange,
} from '../../../core/directives/progress-trigger.directive';
import type { StyleValues } from '../../../core/animation/spring-style-runner';
import type { Stat } from '../../../data/home-content';

@Component({
  selector: 'app-stat-counter',
  standalone: true,
  imports: [InViewDirective, ProgressTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-counter.component.html',
  host: { '[style.display]': "'contents'" },
})
export class StatCounterComponent {
  readonly stat = input.required<Stat>();
  readonly index = input.required<number>();

  protected readonly value = signal(0);

  protected readonly inViewFrom: StyleValues = { opacity: 0, transform: 'translateY(20px)' };
  protected readonly inViewTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };
  protected readonly inViewConfig = { tension: 200, friction: 24 };

  protected onProgressChange(change: ProgressTriggerChange): void {
    this.value.set(Math.round(change.progress * this.stat().value));
  }
}
