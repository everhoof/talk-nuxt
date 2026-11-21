import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const nuxtRequire = createRequire(import.meta.resolve('nuxt'));
const { fnv1a64Base36, fnv1a64BigInt } = await import(nuxtRequire.resolve('fnv1a-64'));

test('legacy Nuxt keys match the original BigInt hash for ASCII and Unicode inputs', () => {
  const inputs = ['', 'a', 'Nuxt', 'Привет 🦄', '\u{0}\u{FFFF}', 'x'.repeat(10_000)];
  // Deterministic UTF-16 data includes surrogate pairs and lone surrogates.
  let seed = 42;
  for (let length = 1; length <= 512; length++) {
    let input = '';
    for (let index = 0; index < length; index++) {
      seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
      input += String.fromCodePoint(seed & 65_535);
    }
    inputs.push(input);
  }
  for (const input of inputs) {
    assert.equal(fnv1a64Base36(input), fnv1a64BigInt(input).toString(36));
  }
});
