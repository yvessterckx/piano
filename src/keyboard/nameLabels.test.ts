import { describe, expect, it } from 'vitest';
import { spreadLabels } from './nameLabels';

describe('spreadLabels', () => {
  it('centers labels over their keys when there is room', () => {
    expect(
      spreadLabels(
        [
          { center: 50, width: 20 },
          { center: 100, width: 20 },
        ],
        300,
        4,
      ),
    ).toEqual([40, 90]);
  });

  it('pushes overlapping labels apart, in key order', () => {
    // Three notes of a chord on 7 px keys: the labels are wider than the keys.
    expect(
      spreadLabels(
        [
          { center: 100, width: 20 },
          { center: 107, width: 20 },
          { center: 114, width: 20 },
        ],
        300,
        4,
      ),
    ).toEqual([90, 114, 138]);
  });

  it('keeps the row inside the keyboard at both edges', () => {
    expect(spreadLabels([{ center: 3, width: 20 }], 300, 4)).toEqual([0]);
    expect(
      spreadLabels(
        [
          { center: 290, width: 20 },
          { center: 296, width: 20 },
        ],
        300,
        4,
      ),
    ).toEqual([256, 280]);
  });

  it('lets labels overlap, inside the keyboard, when they cannot all fit', () => {
    expect(
      spreadLabels(
        [
          { center: 10, width: 20 },
          { center: 20, width: 20 },
        ],
        30,
        4,
      ),
    ).toEqual([0, 10]);
  });
});
