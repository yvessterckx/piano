import { BEAT_EPSILON } from '../timeline/buildTimeline';

/** A note column of a measure: the cursor stands here while that beat sounds. */
export interface CursorColumn {
  readonly beatInMeasure: number;
  /** Horizontal center of the column, in score units. */
  readonly x: number;
}

/** Where the cursor can stand in one measure, in score units (renderer coordinates). */
export interface MeasureLayout {
  /** Sorted by beat; at least one column. */
  readonly columns: readonly CursorColumn[];
  /** Top of the first staff of the system the measure is drawn in. */
  readonly top: number;
  /** Bottom of the last staff of that system. */
  readonly bottom: number;
}

/** Indexed by source measure index; undefined for a measure that is not drawn. */
export type ScoreLayout = readonly (MeasureLayout | undefined)[];

export interface CursorBox {
  readonly x: number;
  readonly top: number;
  readonly bottom: number;
}

/**
 * The cursor position for a beat within a measure of the score: the last column at or before
 * that beat, so the cursor rests on the note that is sounding. Binary search: no walk through
 * the score.
 */
export function cursorBoxAt(
  layout: ScoreLayout,
  sourceIndex: number,
  beatInMeasure: number,
): CursorBox | undefined {
  const measure = layout[sourceIndex];
  const first = measure?.columns[0];
  if (!measure || !first) return undefined;

  let low = 0;
  let high = measure.columns.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const column = measure.columns[middle];
    if (column && column.beatInMeasure <= beatInMeasure + BEAT_EPSILON) low = middle;
    else high = middle - 1;
  }

  const column = measure.columns[low] ?? first;
  return { x: column.x, top: measure.top, bottom: measure.bottom };
}
