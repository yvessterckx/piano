/** A note name to place above the keyboard: centered over its key if there is room. */
export interface LabelSpan {
  /** Horizontal center of the key, in px from the left of the keyboard. */
  readonly center: number;
  readonly width: number;
}

/**
 * Left edges for labels in a row above the keys, in the order of the keys (low to high). Each
 * label is centered over its key when it can be; labels that would overlap are pushed apart, and
 * the row is kept within [0, total]. If they cannot all fit, they overlap.
 */
export function spreadLabels(labels: readonly LabelSpan[], total: number, gap: number): number[] {
  const lefts: number[] = [];
  let previousRight = -gap;
  for (const { center, width } of labels) {
    const left = Math.max(center - width / 2, previousRight + gap, 0);
    lefts.push(left);
    previousRight = left + width;
  }
  let nextLeft = total + gap;
  for (let i = labels.length - 1; i >= 0; i--) {
    const width = labels[i]?.width ?? 0;
    const left = Math.max(Math.min(lefts[i] ?? 0, nextLeft - gap - width), 0);
    lefts[i] = left;
    nextLeft = left;
  }
  return lefts;
}
