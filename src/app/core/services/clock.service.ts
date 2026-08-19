// Port of src/hooks/use-clock.ts
// Live local time + date, updated every second.
import { Injectable, computed, signal } from '@angular/core';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface FormattedClock {
  time: string;
  date: string;
}

function format(now: Date): FormattedClock {
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const meridiem = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  const time = `${hours}:${minutes.toString().padStart(2, '0')}${meridiem}`;
  const date = `${now.getDate()} ${MONTHS[now.getMonth()]}, ${now.getFullYear()}`;
  return { time, date };
}

@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly clock = signal<FormattedClock | null>(null);

  /** e.g. "9:41am" — lower-case meridiem, no leading zero on the hour. */
  readonly time = computed(() => this.clock()?.time ?? '');
  /** e.g. "12 March, 2025". */
  readonly date = computed(() => this.clock()?.date ?? '');
  /** False until the first client tick (avoids an SSR/CSR mismatch on `new Date()`). */
  readonly ready = computed(() => this.clock() !== null);

  constructor() {
    if (typeof window === 'undefined') return;
    const update = () => this.clock.set(format(new Date()));
    update();
    setInterval(update, 1000);
  }
}
