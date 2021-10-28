/**
 * Returns the `value` clamped between `min` and `max`.
 * @param {number} min
 * @param {number} value
 * @param {number} max
 * @returns {number}
 */
export const clamp = (min: number, value: number, max: number) => Math.max(min, Math.min(value, max));
