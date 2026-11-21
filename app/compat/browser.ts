// Patch native DOM event listeners before installing the constructible EventTarget fallback.
import '@wessberg/pointer-events';
import 'intersection-observer';
import 'focus-visible';
import {
  AbortController,
  AbortSignal,
} from 'abort-controller';
import {

  fetch,
  Headers,
  Request,
  Response,
} from 'whatwg-fetch';
import { EventTarget } from 'event-target-shim';
import ResizeObserver from 'resize-observer-polyfill';
import { polyfill } from 'smoothscroll-polyfill';
import { polyfill as polyfillKeyboard } from 'keyboardevent-key-polyfill';

polyfillKeyboard();

if (typeof globalThis.AbortController !== 'function') {
  // Use XHR-backed fetch so aborting also cancels the network request.
  Object.assign(globalThis, {
    AbortController, AbortSignal, fetch, Headers, Request, Response,
  });
}

// Older browsers expose EventTarget but do not allow constructing one.
try {
  new globalThis.EventTarget();
} catch {
  Object.defineProperty(globalThis, 'EventTarget', { configurable: true, writable: true, value: EventTarget });
}

if (!globalThis.ResizeObserver) {
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, writable: true, value: ResizeObserver });
}

// TanStack Virtual uses Element.scrollTo({ top, left }), absent in Chrome 49 and Firefox 52.
polyfill();

// Tiptap's Vue adapter moves the editor DOM with Element.append(...nodes).
if (typeof Element.prototype.append !== 'function') {
  Object.defineProperty(Element.prototype, 'append', {
    configurable: true,
    writable: true,
    value(this: Element, ...nodes: (Node | string)[]): void {
      // eslint-disable-next-line unicorn/no-this-assignment, ts/no-this-alias, unicorn/no-this-outside-of-class
      const element = this;
      const fragment = element.ownerDocument.createDocumentFragment();
      for (const node of nodes) {
        fragment.appendChild(typeof node === 'string' ? element.ownerDocument.createTextNode(node) : node);
      }
      element.appendChild(fragment);
    },
  });
}

// TanStack Virtual checks connectivity before measuring rows and observing their size.
if (!('isConnected' in Node.prototype)) {
  Object.defineProperty(Node.prototype, 'isConnected', {
    configurable: true,
    get(this: Node): boolean {
      // eslint-disable-next-line unicorn/no-this-outside-of-class
      return this.getRootNode({ composed: true }).nodeType === Node.DOCUMENT_NODE;
    },
  });
}

// Unhead reads attribute names while reconciling the server-rendered head.
if (typeof Element.prototype.getAttributeNames !== 'function') {
  Object.defineProperty(Element.prototype, 'getAttributeNames', {
    configurable: true,
    writable: true,
    value(this: Element): string[] {
      // eslint-disable-next-line unicorn/no-this-outside-of-class
      return Array.from(this.attributes, (attribute) => attribute.name);
    },
  });
}

// ProseMirror uses getRootNode to find the editor's document or shadow root.
if (typeof Node.prototype.getRootNode !== 'function') {
  Object.defineProperty(Node.prototype, 'getRootNode', {
    configurable: true,
    writable: true,
    value(this: Node, options?: GetRootNodeOptions): Node {
      // A DOM prototype method must traverse from its receiver.
      // eslint-disable-next-line unicorn/no-this-assignment, ts/no-this-alias, unicorn/no-this-outside-of-class
      let root: Node = this;
      while (root.parentNode) root = root.parentNode;
      const host = (root as ShadowRoot).host;
      return options?.composed && host ? host.getRootNode(options) : root;
    },
  });
}
