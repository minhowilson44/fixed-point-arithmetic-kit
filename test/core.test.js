"use strict";

import test from "node:test";
import assert from "node:assert/strict";

import {
  add,
  sub,
  mul,
  div,
  addBigInt,
  subBigInt,
  mulBigInt,
  divBigInt,
} from "../src/index.js";

const MIN_INT64 = -(2n ** 63n);
const MAX_INT64 = 2n ** 63n - 1n;

test("add saturates at positive bound", () => {
  assert.equal(add(Number(MAX_INT64), 1), Number(MAX_INT64));
});

test("add saturates at negative bound", () => {
  assert.equal(add(Number(MIN_INT64), -1), Number(MIN_INT64));
});

test("add normal case", () => {
  assert.equal(add(10, 20), 30);
});

test("sub saturates at negative bound", () => {
  assert.equal(sub(Number(MIN_INT64), 1), Number(MIN_INT64));
});

test("sub normal case", () => {
  assert.equal(sub(50, 8), 42);
});

test("mul truncates toward zero for positive", () => {
  // 3.5 * 2.5 with scale 1: (7 * 5) >> 1 = 35 >> 1 = 17 (17.5 truncated)
  assert.equal(mul(7, 5, 1), 17);
});

test("mul truncates toward zero for negative", () => {
  // -3.5 * 2.5 with scale 1: (-7 * 5) >> 1 = -35 >> 1 = -18 (arithmetic shift)
  // but we want truncation toward zero: -17
  assert.equal(mul(-7, 5, 1), -17);
});

test("mul saturates on overflow", () => {
  assert.equal(mul(Number(MAX_INT64), 2, 0), Number(MAX_INT64));
});

test("div rounds toward zero", () => {
  // 7 / 2 with scale 1: (7 << 1) / 2 = 14 / 2 = 7 (3.5)
  assert.equal(div(7, 2, 1), 7);
  // 7 / 3 with scale 1: (7 << 1) / 3 = 14 / 3 = 4 (4.666 truncated)
  assert.equal(div(7, 3, 1), 4);
});

test("div by zero saturates with sign of numerator", () => {
  assert.equal(div(5, 0, 2), Number(MAX_INT64));
  assert.equal(div(-5, 0, 2), Number(MIN_INT64));
  assert.equal(div(0, 0, 2), Number(MAX_INT64));
});

test("div saturates on overflow", () => {
  assert.equal(div(Number(MAX_INT64), 1, 2), Number(MAX_INT64));
});

test("addBigInt saturates", () => {
  assert.equal(addBigInt(MAX_INT64, 1n), MAX_INT64);
  assert.equal(addBigInt(MIN_INT64, -1n), MIN_INT64);
});

test("subBigInt saturates", () => {
  assert.equal(subBigInt(MIN_INT64, 1n), MIN_INT64);
  assert.equal(subBigInt(MAX_INT64, -1n), MAX_INT64);
});

test("mulBigInt truncates toward zero", () => {
  assert.equal(mulBigInt(-7n, 5n, 1), -17n);
  assert.equal(mulBigInt(7n, 5n, 1), 17n);
});

test("divBigInt by zero saturates", () => {
  assert.equal(divBigInt(5n, 0n, 2), MAX_INT64);
  assert.equal(divBigInt(-5n, 0n, 2), MIN_INT64);
});

test("divBigInt normal", () => {
  assert.equal(divBigInt(7n, 3n, 1), 4n);
});

test("invalid scaleBits throws", () => {
  assert.throws(() => mul(1, 2, -1), RangeError);
  assert.throws(() => div(1, 2, 1.5), RangeError);
  assert.throws(() => mulBigInt(1n, 2n, -1), RangeError);
});

test("non-integer input throws", () => {
  assert.throws(() => add(1.5, 2), RangeError);
  assert.throws(() => sub(1, NaN), RangeError);
  assert.throws(() => mul(Infinity, 2, 0), RangeError);
});
