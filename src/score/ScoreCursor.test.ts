import { describe, expect, it } from 'vitest';
import { scrollToKeepReading } from './ScoreCursor';

const view = { left: 0, top: 0, width: 400, height: 500 };

describe('scrollToKeepReading', () => {
  it('stays when the cursor moves within a visible system', () => {
    expect(
      scrollToKeepReading({ left: 100, right: 300, top: 40, bottom: 200 }, false, view),
    ).toBeUndefined();
  });

  it('brings a new system to the top, so the next systems show below it', () => {
    expect(
      scrollToKeepReading({ left: 20, right: 300, top: 260, bottom: 420 }, true, view),
    ).toEqual({ top: 244, left: 0 });
  });

  it('scrolls to the reading area when it is out of view, also in the same system', () => {
    expect(
      scrollToKeepReading({ left: 20, right: 300, top: 900, bottom: 1060 }, false, {
        ...view,
        top: 0,
      }),
    ).toEqual({ top: 884, left: 0 });
  });

  it('on one line, moves the current measure to the left edge once the next one is cut off', () => {
    const line = { left: 0, top: 0, width: 700, height: 300 };
    expect(
      scrollToKeepReading({ left: 300, right: 650, top: 30, bottom: 250 }, false, line),
    ).toBeUndefined();
    expect(
      scrollToKeepReading({ left: 450, right: 900, top: 30, bottom: 250 }, false, line),
    ).toEqual({
      top: 0,
      left: 434,
    });
  });

  it('scrolls back when the reading area is left of the view (after a seek)', () => {
    const line = { left: 2000, top: 0, width: 700, height: 300 };
    expect(
      scrollToKeepReading({ left: 100, right: 500, top: 30, bottom: 250 }, false, line),
    ).toEqual({
      top: 0,
      left: 84,
    });
  });
});
