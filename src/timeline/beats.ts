/**
 * Tolerance for comparing beats. Beats are fractions of a quarter note converted to floating
 * point (e.g. triplets), so values that are equal on paper can differ in the last bits.
 */
export const BEAT_EPSILON = 1e-6;
