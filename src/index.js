"use strict";

/**
 * Public entry point for the fixed-point arithmetic kit.
 *
 * All operations work on scaled integers: a value `n` with scale `2^scaleBits`
 * represents the real number `n / 2^scaleBits`. The functions saturate at the
 * signed 64-bit integer bounds rather than wrapping or throwing on overflow.
 */

export {
  add,
  sub,
  mul,
  div,
  addBigInt,
  subBigInt,
  mulBigInt,
  divBigInt,
} from "./core.js";
