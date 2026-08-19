// Port of src/utils/math.ts
// Support utility used by the trigger directives (scrub-mode interpolation).

export function transformRange(
  value: number,
  min: number,
  max: number,
  newMin: number,
  newMax: number,
): number {
  const normalized = (Math.min(Math.max(value, min), max) - min) / (max - min);
  return newMin + normalized * (newMax - newMin);
}

export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

export function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  }) as T;
}

type StyleValue = string | number;

interface ExtractedNumber {
  number: number;
  unit: string | null;
}

function extractNumber(value: StyleValue | undefined): ExtractedNumber {
  if (typeof value === 'number') return { number: value, unit: null };
  if (typeof value === 'string') {
    // Handle CSS transform functions like translate(10px) or rotate(45deg)
    const functionMatch = value.match(/^([a-zA-Z]+)\(([-0-9.]+)([^)]*)\)$/);
    if (functionMatch) {
      return {
        number: parseFloat(functionMatch[2]),
        unit: `${functionMatch[1]}(${functionMatch[3]})`,
      };
    }
    // Handle regular values with units like 45deg or 100px
    const match = value.match(/([-0-9.]+)([^0-9.]+)/);
    if (match) {
      return { number: parseFloat(match[1]), unit: match[2] };
    }
  }
  return { number: 0, unit: null };
}

/**
 * Interpolates between corresponding properties of `start`/`end` at
 * `progress` (0-1), preserving CSS units and transform-function wrapping.
 */
export function interpolate(
  start: Record<string, StyleValue>,
  end: Record<string, StyleValue>,
  progress: number,
): Record<string, StyleValue> {
  const result: Record<string, StyleValue> = {};

  for (const key in start) {
    const startVal = extractNumber(start[key]);
    const endVal = extractNumber(end[key]);

    if (startVal.unit !== null || endVal.unit !== null) {
      const unit = startVal.unit || endVal.unit || '';
      if (unit.includes('(')) {
        const fnName = unit.split('(')[0];
        const suffix = unit.split(')')[0].slice(fnName.length);
        result[key] = `${fnName}(${lerp(startVal.number, endVal.number, progress)}${suffix})`;
      } else {
        result[key] = `${lerp(startVal.number, endVal.number, progress)}${unit}`;
      }
    } else {
      result[key] = lerp(startVal.number, endVal.number, progress);
    }
  }

  return result;
}
