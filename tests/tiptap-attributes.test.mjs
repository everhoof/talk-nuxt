import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { mergeAttributes } from '@tiptap/core';
import { DOMSerializer } from '@tiptap/pm/model';

const require = createRequire(import.meta.url);
const commonjsMergeAttributes = require('@tiptap/core').mergeAttributes;

for (const [name, merge] of [['ESM', mergeAttributes], ['CommonJS', commonjsMergeAttributes]]) {
  test(`${name} Tiptap attributes cannot inherit attacker-controlled DOM attributes`, () => {
    const input = JSON.parse('{"__proto__":{"data-security-canary":"present","onerror":"canary"}}');
    for (const objects of [[input], [{ class: 'base' }, input, { class: 'extra' }]]) {
      const attributes = merge(...objects);
      assert.equal(Object.getPrototypeOf(attributes), Object.prototype);
      assert.equal(attributes['data-security-canary'], undefined);
      assert.equal(attributes.onerror, undefined);
      const document = {
        createElement() {
          const domAttributes = Object.create(null);
          return {
            nodeType: 1,
            attributes: domAttributes,
            setAttribute(key, value) {
              domAttributes[key] = String(value);
            },
          };
        },
      };
      const { dom } = DOMSerializer.renderSpec(document, ['span', attributes]);
      assert.equal(dom.attributes['data-security-canary'], undefined);
      assert.equal(dom.attributes.onerror, undefined);
    }
  });
}
