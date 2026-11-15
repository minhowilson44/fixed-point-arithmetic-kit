"use strict";

/**
 * Core fixed-point arithmetic operations on scaled integers.
 *
 * A fixed-point number is represented as a plain integer `n` together with
 * an implicit scale `2^scaleBits`. The real value is `n / 2^scaleBits`.
 *
 * All operations saturate at the representable bounds for the given scale.
 * We use 64-bit signed integers (BigInt) internally to avoid precision loss
 * and to make overflow detection explicit. The API accepts and returns
 * JavaScript `number` values, but for large scales or large magnitudes that
 * may lose precision. We choose `number` because it is the common case and
 * keeps the surface small; callers who need full 64-bit range can use the
 * `*BigInt` variants.
 */

/**
 * Minimum and maximum representable integer values for a signed 64-bit integer.
 * We use BigInt to represent these exactly.
 */
const MIN_INT64 = -(1n << 63n);
const MAX_INT64 = (1n << 63n) - 1n;

/**
 * Clamp a BigInt to the signed 64-bit range.
 * @param {bigint} value
 * @returns {bigint}
 */
function clampInt64(value) {
  if (value < MIN_INT64) return MIN_INT64;
  if (value > MAX_INT64) return MAX_INT64;
  return value;
}

/**
 * Convert a JavaScript number to BigInt, rounding toward zero.
 * Throws if the number is not finite or not an integer.
 * @param {number} n
 * @returns {bigint}
 */
function numberToBigInt(n) {
  if (!Number.isFinite(n)) {
    throw new RangeError("value must be finite");
  }
  if (!Number.isInteger(n)) {
    throw new RangeError("value must be an integer");
  }
  return BigInt(n);
}

/**
 * Saturating addition of two fixed-point numbers.
 * @param {number} a scaled integer
 * @param {number} b scaled integer
 * @returns {number} saturated sum as a safe integer
 */
export function add(a, b) {
  return Number(clampInt64(numberToBigInt(a) + numberToBigInt(b)));
}

/**
 * Saturating subtraction of two fixed-point numbers.
 * @param {number} a scaled integer
 * @param {number} b scaled integer
 * @returns {number} saturated difference as a safe integer
 */
export function sub(a, b) {
  return Number(clampInt64(numberToBigInt(a) - numberToBigInt(b)));
}

/**
 * Saturating multiplication of two fixed-point numbers.
 *
 * The raw product is `a * b`, which is in units of `2^(2*scaleBits)`, so we
 * divide by `2^scaleBits` to return to the original scale. We round toward
 * zero (truncation) to keep the result an integer. This is the simplest
 * deterministic rounding rule and avoids a dependency on a rounding mode.
 *
 * @param {number} a scaled integer
 * @param {number} b scaled integer
 * @param {number} scaleBits number of fractional bits
 * @returns {number} saturated product as a safe integer
 */
export function mul(a, b, scaleBits) {
  if (!Number.isInteger(scaleBits) || scaleBits < 0) {
    throw new RangeError("scaleBits must be a non-negative integer");
  }
  const shift = BigInt(scaleBits);
  const product = numberToBigInt(a) * numberToBigInt(b);
  const scaled = product >> shift; // arithmetic shift, truncates toward zero for positive
  // For negative numbers, BigInt >> is arithmetic and truncates toward -infinity.
  // We want truncation toward zero, so adjust when the product is negative and
  // the shift lost bits.
  let result;
  if (product < 0n && (product & ((1n << shift) - 1n)) !== 0n) {
    result = scaled + 1n;
  } else {
    result = scaled;
  }
  return Number(clampInt64(result));
}

/**
 * Saturating division of two fixed-point numbers.
 *
 * The raw quotient is `(a * 2^scaleBits) / b`, rounded toward zero.
 * Division by zero returns the saturated value with the sign of `a`
 * (positive for zero numerator). This is a deliberate choice: IEEE 754
 * would give NaN or Infinity, but in fixed-point arithmetic we prefer a
 * well-defined saturating result. Callers who need to detect division by
 * zero should check `b === 0` before calling.
 *
 * @param {number} a scaled integer
 * @param {number} b scaled integer
 * @param {number} scaleBits number of fractional bits
 * @returns {number} saturated quotient as a safe integer
 */
export function div(a, b, scaleBits) {
  if (!Number.isInteger(scaleBits) || scaleBits < 0) {
    throw new RangeError("scaleBits must be a non-negative integer");
  }
  const numerator = numberToBigInt(a);
  const denominator = numberToBigInt(b);
  if (denominator === 0n) {
    return numerator >= 0n ? Number(MAX_INT64) : Number(MIN_INT64);
  }
  const shift = BigInt(scaleBits);
  const scaledNumerator = numerator << shift;
  // BigInt division truncates toward zero, which is what we want.
  const quotient = scaledNumerator / denominator;
  return Number(clampInt64(quotient));
}

/**
 * Saturating addition using BigInt inputs and outputs.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export function addBigInt(a, b) {
  return clampInt64(a + b);
}

/**
 * Saturating subtraction using BigInt inputs and outputs.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export function subBigInt(a, b) {
  return clampInt64(a - b);
}

/**
 * Saturating multiplication using BigInt inputs and outputs.
 * @param {bigint} a
 * @param {bigint} b
 * @param {number} scaleBits
 * @returns {bigint}
 */
export function mulBigInt(a, b, scaleBits) {
  if (!Number.isInteger(scaleBits) || scaleBits < 0) {
    throw new RangeError("scaleBits must be a non-negative integer");
  }
  const shift = BigInt(scaleBits);
  const product = a * b;
  const scaled = product >> shift;
  let result;
  if (product < 0n && (product & ((1n << shift) - 1n)) !== 0n) {
    result = scaled + 1n;
  } else {
    result = scaled;
  }
  return clampInt64(result);
}

/**
 * Saturating division using BigInt inputs and outputs.
 * @param {bigint} a
 * @param {bigint} b
 * @param {number} scaleBits
 * @returns {bigint}
 */
export function divBigInt(a, b, scaleBits) {
  if (!Number.isInteger(scaleBits) || scaleBits < 0) {
    throw new RangeError("scaleBits must be a non-negative integer");
  }
  if (b === 0n) {
    return a >= 0n ? MAX_INT64 : MIN_INT64;
  }
  const shift = BigInt(scaleBits);
  const scaledNumerator = a << shift;
  const quotient = scaledNumerator / b;
  return clampInt64(quotient);
}
