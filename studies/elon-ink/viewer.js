// SPDX-License-Identifier: MIT
// Retained Canvas paths: generate the art once, redraw vectors at every zoom.
(function exposeViewer(scope) {
  'use strict';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  // Keep the toolbar compact even after many consecutive zoom gestures.
  const formatZoom = zoom => zoom < 10000
    ? `${Math.round(zoom * 100)}%`
    : `${zoom.toExponential(2)}×`;

  class Camera {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.fit();
    }
    fit() {
      this.zoom = 1;
      this.x = this.width / 2;
      this.y = this.height / 2;
    }
    constrain() {
      const halfWidth = this.width / (2 * this.zoom);
      const halfHeight = this.height / (2 * this.zoom);
      this.x = clamp(this.x, halfWidth, this.width - halfWidth);
      this.y = clamp(this.y, halfHeight, this.height - halfHeight);
    }
    point(u, v) {
      return {
        x: this.x + (u - 0.5) * this.width / this.zoom,
        y: this.y + (v - 0.5) * this.height / this.zoom,
      };
    }
    zoomTo(value, u = 0.5, v = 0.5) {
      this.gesture(value, u, v, u, v);
    }
    gesture(value, fromU, fromV, toU, toV) {
      // There is no artistic zoom ceiling. Reject numeric overflow so that
      // an extreme input cannot poison the camera or prevent zooming back out.
      if (!Number.isFinite(value)) return;
      const anchor = this.point(fromU, fromV);
      this.zoom = Math.max(1, value);
      this.x = anchor.x - (toU - 0.5) * this.width / this.zoom;
      this.y = anchor.y - (toV - 0.5) * this.height / this.zoom;
      this.constrain();
    }
    pan(du, dv) {
      this.x -= du * this.width / this.zoom;
      this.y -= dv * this.height / this.zoom;
      this.constrain();
    }
  }

  const styleKeys = ['fillStyle', 'strokeStyle', 'globalAlpha', 'lineWidth', 'lineCap', 'lineJoin', 'lineDashOffset'];

  class Drawing {
    constructor() {
      this.operations = [];
      this.stack = [];
      this.state = {
        fillStyle: '#111', strokeStyle: '#111', globalAlpha: 1,
        lineWidth: 1, lineCap: 'round', lineJoin: 'round', lineDashOffset: 0,
      };
      this.dash = [];
    }
    save() {
      this.stack.push({ state: { ...this.state }, dash: this.dash });
      this.operations.push({ method: 'save', args: [] });
    }
    restore() {
      const saved = this.stack.pop();
      if (!saved) throw new Error('Unbalanced drawing restore.');
      this.state = saved.state;
      this.dash = saved.dash;
      this.operations.push({ method: 'restore', args: [] });
    }
    translate(x, y) { this.operations.push({ method: 'translate', args: [x, y] }); }
    rotate(angle) { this.operations.push({ method: 'rotate', args: [angle] }); }
    clip(path) { this.operations.push({ method: 'clip', args: [path] }); }
    setLineDash(values) { this.dash = values.slice(); }
    beginPath() { this.currentPath = new Path2D(); }
    moveTo(...args) { this.currentPath.moveTo(...args); }
    lineTo(...args) { this.currentPath.lineTo(...args); }
    bezierCurveTo(...args) { this.currentPath.bezierCurveTo(...args); }
    quadraticCurveTo(...args) { this.currentPath.quadraticCurveTo(...args); }
    ellipse(...args) { this.currentPath.ellipse(...args); }
    closePath() { this.currentPath.closePath(); }
    fill(path = this.currentPath) { this.record('fill', path); }
    stroke(path = this.currentPath) { this.record('stroke', path); }
    record(method, path) {
      this.operations.push({ method, path, style: { ...this.state }, dash: this.dash });
    }
    paint(ctx) {
      let previous = {}, lastDash = null;
      for (const op of this.operations) {
        if (!op.path) {
          ctx[op.method](...op.args);
          if (op.method === 'restore') { previous = {}; lastDash = null; }
          continue;
        }
        for (const key of styleKeys) {
          if (previous[key] !== op.style[key]) ctx[key] = op.style[key];
        }
        if (op.dash !== lastDash) ctx.setLineDash(op.dash);
        ctx[op.method](op.path);
        previous = op.style;
        lastDash = op.dash;
      }
    }
  }
  for (const key of styleKeys) {
    Object.defineProperty(Drawing.prototype, key, {
      get() { return this.state[key]; },
      set(value) { this.state[key] = value; },
    });
  }

  function create(root, { width, height }) {
    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const status = root.querySelector('[data-zoom-status]');
    const zoomIn = root.querySelector('[data-zoom-in]');
    const zoomOut = root.querySelector('[data-zoom-out]');
    const fit = root.querySelector('[data-zoom-fit]');
    const buttons = [zoomIn, zoomOut, fit];
    if (!ctx) {
      status.textContent = 'Canvas unavailable';
      buttons.forEach(button => { button.disabled = true; });
      return null;
    }

    const drawing = new Drawing();
    const camera = new Camera(width, height);
    const pointers = new Map();
    let frame = 0, ready = false, cssWidth = 0, cssHeight = 0;

    function paint() {
      frame = 0;
      if (!ready || !cssWidth) return;
      const pixelRatio = Math.min(scope.devicePixelRatio || 1, 2);
      const pixelWidth = Math.max(1, Math.round(cssWidth * pixelRatio));
      const pixelHeight = Math.max(1, Math.round(cssHeight * pixelRatio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, pixelWidth, pixelHeight);
      const scale = pixelWidth / width * camera.zoom;
      ctx.save();
      ctx.setTransform(scale, 0, 0, scale,
        pixelWidth / 2 - camera.x * scale, pixelHeight / 2 - camera.y * scale);
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      drawing.paint(ctx);
      ctx.restore();
      canvas.dataset.zoom = String(camera.zoom);
      canvas.dataset.centerX = String(camera.x);
      canvas.dataset.centerY = String(camera.y);
    }
    function requestPaint() {
      const label = formatZoom(camera.zoom);
      if (status.textContent !== label) status.textContent = label;
      zoomOut.disabled = camera.zoom <= 1;
      canvas.dataset.pannable = String(camera.zoom > 1);
      if (!frame && ready) frame = requestAnimationFrame(paint);
    }
    function resize() {
      const box = canvas.getBoundingClientRect();
      cssWidth = box.width;
      cssHeight = box.height;
      requestPaint();
    }
    function position(event) {
      const box = canvas.getBoundingClientRect();
      return { u: (event.clientX - box.left) / box.width, v: (event.clientY - box.top) / box.height };
    }
    function zoomBy(factor, u = 0.5, v = 0.5) {
      camera.zoomTo(camera.zoom * factor, u, v);
      requestPaint();
    }
    function reset() { camera.fit(); requestPaint(); }
    zoomIn.addEventListener('click', () => zoomBy(1.6));
    zoomOut.addEventListener('click', () => zoomBy(1 / 1.6));
    fit.addEventListener('click', reset);
    canvas.addEventListener('dblclick', event => {
      const point = position(event);
      zoomBy(2, point.u, point.v);
    });
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      const point = position(event);
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? cssHeight : 1;
      zoomBy(Math.exp(-clamp(event.deltaY * unit, -400, 400) * 0.002), point.u, point.v);
    }, { passive: false });

    function pair() {
      const [a, b] = [...pointers.values()];
      return {
        u: (a.u + b.u) / 2, v: (a.v + b.v) / 2,
        distance: Math.hypot((a.u - b.u) * cssWidth, (a.v - b.v) * cssHeight),
      };
    }
    canvas.addEventListener('pointerdown', event => {
      if ((event.pointerType === 'mouse' && event.button !== 0) || pointers.size >= 2) return;
      pointers.set(event.pointerId, position(event));
      canvas.setPointerCapture(event.pointerId);
      canvas.dataset.dragging = 'true';
    });
    canvas.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      const previous = pointers.get(event.pointerId);
      const previousPair = pointers.size === 2 ? pair() : null;
      const next = position(event);
      pointers.set(event.pointerId, next);
      if (previousPair) {
        const nextPair = pair();
        if (previousPair.distance > 1 && nextPair.distance > 1) {
          camera.gesture(camera.zoom * nextPair.distance / previousPair.distance,
            previousPair.u, previousPair.v, nextPair.u, nextPair.v);
        }
      } else camera.pan(next.u - previous.u, next.v - previous.v);
      requestPaint();
    });
    function release(event) {
      pointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.dataset.dragging = String(pointers.size > 0);
    }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(event, release);
    }

    // Native toolbar buttons supply keyboard focus; arrow keys pan from there.
    root.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const step = 0.075;
      const actions = {
        '+': () => zoomBy(1.6), '=': () => zoomBy(1.6), '-': () => zoomBy(1 / 1.6),
        '0': reset, Home: reset,
        ArrowLeft: () => camera.pan(step, 0), ArrowRight: () => camera.pan(-step, 0),
        ArrowUp: () => camera.pan(0, step), ArrowDown: () => camera.pan(0, -step),
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      actions[event.key]();
      requestPaint();
    });
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    scope.addEventListener('resize', resize);
    return {
      context: drawing,
      finish() {
        if (drawing.stack.length) throw new Error('Unbalanced drawing save.');
        ready = true;
        resize();
      },
    };
  }

  const api = { Camera, Drawing, create, formatZoom };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else scope.CanvasArtViewer = api;
})(typeof window === 'undefined' ? globalThis : window);
