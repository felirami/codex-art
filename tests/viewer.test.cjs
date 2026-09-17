// SPDX-License-Identifier: MIT
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Camera, Drawing, formatZoom } = require('../studies/elon-ink/viewer.js');

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('zoom keeps the detail under the pointer stationary', () => {
  const camera = new Camera(420, 510);
  const anchor = camera.point(0.23, 0.65);
  camera.zoomTo(8, 0.23, 0.65);
  close(camera.point(0.23, 0.65).x, anchor.x);
  close(camera.point(0.23, 0.65).y, anchor.y);
  camera.zoomTo(2, 0.23, 0.65);
  close(camera.point(0.23, 0.65).x, anchor.x);
  close(camera.point(0.23, 0.65).y, anchor.y);
});

test('pinching can move and magnify the same detail together', () => {
  const camera = new Camera(420, 510);
  camera.zoomTo(2);
  const anchor = camera.point(0.4, 0.45);
  camera.gesture(4, 0.4, 0.45, 0.6, 0.7);
  close(camera.point(0.6, 0.7).x, anchor.x);
  close(camera.point(0.6, 0.7).y, anchor.y);
});

test('panning follows the drag and cannot reveal space outside the artwork', () => {
  const camera = new Camera(420, 510);
  camera.zoomTo(4);
  const anchor = camera.point(0.5, 0.5);
  camera.pan(0.1, -0.2);
  close(camera.point(0.6, 0.3).x, anchor.x);
  close(camera.point(0.6, 0.3).y, anchor.y);
  camera.pan(100, 100);
  assert.deepEqual(camera.point(0, 0), { x: 0, y: 0 });
  camera.pan(-100, -100);
  assert.deepEqual(camera.point(1, 1), { x: 420, y: 510 });
});

test('zoom continues beyond 16× while preserving its anchor', () => {
  const camera = new Camera(420, 510);
  const anchor = camera.point(0.3, 0.7);
  for (const zoom of [16, 32, 1000, 1000000, 1e12]) {
    camera.zoomTo(zoom, 0.3, 0.7);
    assert.equal(camera.zoom, zoom);
    close(camera.point(0.3, 0.7).x, anchor.x);
    close(camera.point(0.3, 0.7).y, anchor.y);
  }
});

test('zooming out and fit restore the complete composition from deep zoom', () => {
  const camera = new Camera(420, 510);
  camera.zoomTo(1000, 0.1, 0.8);
  camera.zoomTo(0.01);
  assert.equal(camera.zoom, 1);
  assert.deepEqual(camera.point(0, 0), { x: 0, y: 0 });
  assert.deepEqual(camera.point(1, 1), { x: 420, y: 510 });
  camera.zoomTo(1e12);
  camera.pan(0.2, -0.4);
  camera.fit();
  assert.equal(camera.zoom, 1);
  assert.deepEqual(camera.point(0.5, 0.5), { x: 210, y: 255 });
});

test('numeric overflow cannot trap the camera in an invalid state', () => {
  const camera = new Camera(420, 510);
  camera.zoomTo(1000, 0.3, 0.7);
  const previous = { ...camera };
  for (const invalid of [Infinity, -Infinity, NaN]) {
    camera.zoomTo(invalid, 0.1, 0.9);
    assert.deepEqual({ ...camera }, previous);
  }
  camera.zoomTo(camera.zoom / 2);
  assert.equal(camera.zoom, 500);
  camera.fit();
  assert.equal(camera.zoom, 1);
});

test('deep zoom labels remain compact without overflowing their numbers', () => {
  assert.equal(formatZoom(1), '100%');
  assert.equal(formatZoom(32), '3200%');
  assert.equal(formatZoom(1e6), '1.00e+6×');
  for (const zoom of [1e20, 1e200, Number.MAX_VALUE]) {
    const label = formatZoom(zoom);
    assert.ok(label.length <= 11);
    assert.doesNotMatch(label, /Infinity|NaN/);
  }
});

test('replay preserves clipping, transform order, and restored pen styles', () => {
  const drawing = new Drawing();
  const calls = [], states = [];
  const context = {
    save() { states.push({ strokeStyle: this.strokeStyle, lineWidth: this.lineWidth }); calls.push('save'); },
    restore() { Object.assign(this, states.pop()); calls.push('restore'); },
    translate(x, y) { calls.push(['translate', x, y]); },
    rotate(angle) { calls.push(['rotate', angle]); },
    clip(path) { calls.push(['clip', path]); },
    setLineDash(values) { this.dash = values; },
    stroke(path) { calls.push(['stroke', path, this.strokeStyle, this.lineWidth, this.dash]); },
  };
  const first = {}, clipped = {}, last = {}, mask = {};
  drawing.strokeStyle = '#111';
  drawing.lineWidth = 0.3;
  drawing.stroke(first);
  drawing.save();
  drawing.clip(mask);
  drawing.translate(10, 20);
  drawing.rotate(0.5);
  drawing.strokeStyle = '#fff';
  drawing.lineWidth = 0.6;
  drawing.setLineDash([2, 1]);
  drawing.stroke(clipped);
  drawing.restore();
  drawing.stroke(last);
  drawing.paint(context);
  assert.deepEqual(calls, [
    ['stroke', first, '#111', 0.3, []], 'save', ['clip', mask],
    ['translate', 10, 20], ['rotate', 0.5],
    ['stroke', clipped, '#fff', 0.6, [2, 1]], 'restore',
    ['stroke', last, '#111', 0.3, []],
  ]);
});
