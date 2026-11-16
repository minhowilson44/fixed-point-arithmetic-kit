# fixed-point-arithmetic-kit

Saturating add, subtract, multiply, and divide on fixed-point numbers represented as scaled integers.

## Usage

```js
import { add, sub, mul, div } from "fixed-point-arithmetic-kit";

// All values are scaled integers. With scaleBits = 4, the real value is n / 16.
// 3.5 is represented as 56 (3.5 * 16).
const a = 56; // 3.5
const b = 24; // 1.5

add(a, b);          // 80  (5.0)
sub(a, b);          // 32  (2.0)
mul(a, b, 4);       // 84  (5.25)
div(a, b, 4);       // 37  (2.3125, truncated)
```

BigInt variants are available when the full 64-bit range is needed:

```js
import { addBigInt, divBigInt } from "fixed-point-arithmetic-kit";

addBigInt(1n, 2n);        // 3n
divBigInt(7n, 3n, 1);     // 4n
```

## Why this exists

Fixed-point arithmetic is common in embedded, audio, and financial code where
floating point is either unavailable or undesirable. The usual problem is
overflow: adding two large fixed-point numbers can wrap around silently. This
library instead saturates at the signed 64-bit bounds, which is easier to
reason about and matches the behaviour of many DSP and embedded runtimes.

The trade-off is that saturation hides overflow. If you need to detect it, you
must check the operands yourself before calling. We chose saturation because it
is the safer default for real-time systems where a wrapped value is worse than
a clipped one.

## Edge cases

- Division by zero returns the saturated value with the sign of the numerator
  (positive for zero). This is a deliberate choice: IEEE 754 would give NaN or
  Infinity, but fixed-point code usually wants a defined result. Check `b === 0`
  before calling if you need to handle it differently.
- Multiplication and division round toward zero (truncation). This is the
  simplest deterministic rule and avoids a rounding-mode dependency.
- The `number` API accepts only finite integers and throws `RangeError`
  otherwise. For values outside the safe integer range, use the `BigInt`
  variants.
