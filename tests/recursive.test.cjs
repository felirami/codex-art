// SPDX-License-Identifier: MIT
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { RecursiveSymbol, symbolTransform, visibleSymbol } = require('../studies/elon-ink/viewer.js');

test('a rotated miniature stays centered at its fixed position in the parent', () => {
  const parent = { a: 0, b: 2, c: -2, d: 0, e: 800, f: 0 };
  const site = { x: 100, y: 150, height: 50, angle: 0.3 };
  const t = symbolTransform(parent, site, 335, 420);
  const x = t.a * 335 / 2 + t.c * 420 / 2 + t.e;
  const y = t.b * 335 / 2 + t.d * 420 / 2 + t.f;
  assert.ok(Math.abs(x - 500) < 1e-9);
  assert.ok(Math.abs(y - 200) < 1e-9);
  assert.ok(Math.abs(Math.hypot(t.a, t.b) * 420 - 100) < 1e-9);
});

test('culling keeps partly visible rotated portraits and rejects distant ones', () => {
  const viewport = { width: 100, height: 100 };
  const t = { a: 0, b: 1, c: -1, d: 0, e: 150, f: 20 };
  assert.equal(visibleSymbol(t, 100, 200, viewport), true);
  assert.equal(visibleSymbol({ ...t, e: 500 }, 100, 200, viewport), false);
  assert.equal(visibleSymbol({ ...t, f: -300 }, 100, 200, viewport), false);
});

function fixture() {
  const counts = { paper: 0, ink: 0, detail: 0, proxy: 0, saves: 0 };
  const ctx = {
    save() { counts.saves++; }, restore() { counts.saves--; },
    setTransform() {}, beginPath() {}, rect() {}, clip() {},
    fill() { counts.proxy++; },
  };
  const symbol = new RecursiveSymbol(100, 100);
  symbol.paper = { paint() { counts.paper++; } };
  symbol.ink = { paint() { counts.ink++; } };
  symbol.detail = { paint() { counts.detail++; } };
  symbol.children = [{ x: 50, y: 50, height: 10, angle: 0, opacity: 0.7 }];
  return { symbol, ctx, counts };
}

test('subpixel descendants use their silhouette without expanding the tree', () => {
  const { symbol, ctx, counts } = fixture();
  symbol.paint(ctx, { a: 0.1, b: 0, c: 0, d: 0.1, e: 40, f: 40 }, { width: 100, height: 100 });
  assert.deepEqual(counts, { paper: 0, ink: 0, detail: 0, proxy: 1, saves: 0 });
});

test('deep zoom reveals further generations without a fixed depth or offscreen expansion', () => {
  const { symbol, ctx, counts } = fixture();
  for (let i = 0; i < 100; i++) {
    symbol.children.push({ x: 500 + i * 100, y: 500, height: 10, angle: 0, opacity: 0.7 });
  }
  const scale = 1e12;
  symbol.paint(ctx, {
    a: scale, b: 0, c: 0, d: scale, e: 50 - 50 * scale, f: 50 - 50 * scale,
  }, { width: 100, height: 100 });
  assert.equal(counts.paper, 13);
  assert.equal(counts.detail, 13);
  assert.equal(counts.proxy, 1);
  assert.equal(counts.saves, 0);
});
