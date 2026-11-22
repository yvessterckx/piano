import type { GraphicalMeasure, GraphicalMusicSheet } from 'opensheetmusicdisplay';
import type { CursorColumn, MeasureLayout, ScoreLayout } from '../scoreLayout';

/** OSMD counts time in whole notes; the timeline counts quarter notes. */
const BEATS_PER_WHOLE_NOTE = 4;

/**
 * Reads where every measure is drawn and its cursor columns from OSMD's layout after a render,
 * in OSMD units (10 px per unit at zoom 1). Call it again after each render: a render replaces
 * the layout.
 *
 * Per measure, the staff entries of all staves are combined into one column per beat. The vertical
 * extent is that of the whole system, like OSMD's own cursor.
 */
export function readScoreLayout(graphic: GraphicalMusicSheet): ScoreLayout {
  // A staff that is not drawn (e.g. a hidden instrument) has no GraphicalMeasure: OSMD leaves
  // undefined in MeasureList, although its type does not say so.
  const measureList = graphic.MeasureList as readonly (readonly (GraphicalMeasure | undefined)[])[];
  return measureList.map((staffMeasures): MeasureLayout | undefined => {
    const drawn = staffMeasures.filter(
      (measure): measure is GraphicalMeasure => measure?.isVisible() === true,
    );
    const first = drawn[0];
    const system = first?.ParentMusicSystem;
    const firstStaff = system?.StaffLines[0];
    const lastStaff = system?.StaffLines.at(-1);
    if (!first || !system || !firstStaff || !lastStaff) return undefined;

    const xByBeat = new Map<number, number>();
    for (const measure of drawn) {
      for (const entry of measure.staffEntries) {
        const beat = entry.relInMeasureTimestamp.RealValue * BEATS_PER_WHOLE_NOTE;
        const x = entry.PositionAndShape.AbsolutePosition.x;
        const known = xByBeat.get(beat);
        xByBeat.set(beat, known === undefined ? x : Math.min(known, x));
      }
    }
    const columns: CursorColumn[] = [...xByBeat]
      .map(([beatInMeasure, x]) => ({ beatInMeasure, x }))
      .sort((a, b) => a.beatInMeasure - b.beatInMeasure);
    if (columns.length === 0) return undefined;

    const box = first.PositionAndShape;
    const systemTop = system.PositionAndShape.AbsolutePosition.y;
    return {
      columns,
      left: box.AbsolutePosition.x,
      right: box.AbsolutePosition.x + box.Size.width,
      top: systemTop + firstStaff.PositionAndShape.RelativePosition.y,
      bottom: systemTop + lastStaff.PositionAndShape.RelativePosition.y + lastStaff.StaffHeight,
    };
  });
}
