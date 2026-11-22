import { describe, expect, it } from 'vitest';
import { handForStaff } from './hands';
import type { StaffInfo } from './types';

describe('handForStaff', () => {
  it('plays the top staff of a piano part with the right hand, the bottom staff with the left', () => {
    const staves: StaffInfo[] = [
      { partIndex: 0, staffInPart: 0, stavesInPart: 2 },
      { partIndex: 0, staffInPart: 1, stavesInPart: 2 },
    ];

    expect(staves.map((s) => handForStaff(s, staves))).toEqual(['right', 'left']);
  });

  it('plays a score with one single-staff part per hand as right, then left', () => {
    const staves: StaffInfo[] = [
      { partIndex: 0, staffInPart: 0, stavesInPart: 1 },
      { partIndex: 1, staffInPart: 0, stavesInPart: 1 },
    ];

    expect(staves.map((s) => handForStaff(s, staves))).toEqual(['right', 'left']);
  });

  it('plays a melody part above a piano part with the right hand', () => {
    const staves: StaffInfo[] = [
      { partIndex: 0, staffInPart: 0, stavesInPart: 1 },
      { partIndex: 1, staffInPart: 0, stavesInPart: 2 },
      { partIndex: 1, staffInPart: 1, stavesInPart: 2 },
    ];

    expect(staves.map((s) => handForStaff(s, staves))).toEqual(['right', 'right', 'left']);
  });
});
