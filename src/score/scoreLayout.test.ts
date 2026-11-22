import { describe, expect, it } from 'vitest';
import { cursorBoxAt, measureAtPoint } from './scoreLayout';
import type { ScoreLayout } from './scoreLayout';

const layout: ScoreLayout = [
  {
    columns: [
      { beatInMeasure: 0, x: 10 },
      { beatInMeasure: 1, x: 20 },
      { beatInMeasure: 2.5, x: 30 },
    ],
    left: 5,
    right: 40,
    top: 5,
    bottom: 50,
  },
  undefined,
  { columns: [{ beatInMeasure: 0.5, x: 70 }], left: 5, right: 90, top: 60, bottom: 100 },
];

describe('cursorBoxAt', () => {
  it('stands on the column of the note that is sounding', () => {
    expect(cursorBoxAt(layout, 0, 0)).toEqual({ x: 10, top: 5, bottom: 50 });
    expect(cursorBoxAt(layout, 0, 0.75)?.x).toBe(10);
    expect(cursorBoxAt(layout, 0, 1)?.x).toBe(20);
    expect(cursorBoxAt(layout, 0, 2.4)?.x).toBe(20);
    expect(cursorBoxAt(layout, 0, 3.9)?.x).toBe(30);
  });

  it('uses the first column before the first note of a measure', () => {
    expect(cursorBoxAt(layout, 2, 0)).toEqual({ x: 70, top: 60, bottom: 100 });
  });

  it('returns undefined for a measure that is not drawn or does not exist', () => {
    expect(cursorBoxAt(layout, 1, 0)).toBeUndefined();
    expect(cursorBoxAt(layout, 9, 0)).toBeUndefined();
  });
});

describe('measureAtPoint', () => {
  it('finds the measure under a point, also just above or below its staves', () => {
    expect(measureAtPoint(layout, 20, 30)).toBe(0);
    expect(measureAtPoint(layout, 20, 52)).toBe(0);
    expect(measureAtPoint(layout, 80, 80)).toBe(2);
  });

  it('returns undefined between systems and outside measures', () => {
    expect(measureAtPoint(layout, 20, 55)).toBeUndefined();
    expect(measureAtPoint(layout, 95, 80)).toBeUndefined();
  });
});
