import type { Hand, StaffInfo } from './types';

/**
 * Decides which hand plays a staff.
 *
 * This is an assumption, not information from the file: MusicXML does not say which hand plays
 * a staff. It is kept in this one function so it can later be overridden per piece.
 *
 * - A part with several staves (a piano part): the top staff is the right hand, the others the
 *   left hand.
 * - Single-staff parts (e.g. a piano score saved as one part per hand): the first of them is the
 *   right hand, later ones the left hand.
 */
export function handForStaff(staff: StaffInfo, allStaves: readonly StaffInfo[]): Hand {
  if (staff.stavesInPart > 1) {
    return staff.staffInPart === 0 ? 'right' : 'left';
  }
  const firstSingleStaffPart = allStaves.find((s) => s.stavesInPart === 1)?.partIndex;
  return staff.partIndex === firstSingleStaffPart ? 'right' : 'left';
}
