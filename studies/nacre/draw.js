(() => {
  'use strict';

  // Everything visible in the artwork is drawn here with Canvas 2D.
  // No images, dependencies, shaders, or network requests are involved.
  const root = document.getElementById('nacre-art');
  const canvas = root.querySelector('#nacre-canvas');
  const button = root.querySelector('#nacre-motion');
  const status = root.querySelector('#nacre-status');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    status.textContent = 'Canvas is unavailable in this browser.';
    button.disabled = true;
    return;
  }

  const TAU = Math.PI * 2;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  const strands = 280;
  const samples = 256;
  const ring = Array.from({ length: samples + 1 }, (_, i) => {
    const angle = i / samples * TAU;
    return { angle, sin: Math.sin(angle), cos: Math.cos(angle) };
  });

  let width = 0, height = 0, dpr = 1;
  let phase = 0, lastTick = 0, frame = 0;
  let paused = reducedMotion.matches;
  let inView = true, disposed = false;
  let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
  let palette, dark, background, foreground, backdrop;

  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const rgb = (c, alpha = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;

  // Resolve the host's light/dark theme before passing colors to Canvas.
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  root.append(probe);
  const sampler = document.createElement('canvas');
  sampler.width = sampler.height = 1;
  const sampleContext = sampler.getContext('2d', { willReadFrequently: true });
  function color(variable) {
    probe.style.color = `var(${variable})`;
    sampleContext.clearRect(0, 0, 1, 1);
    sampleContext.fillStyle = getComputedStyle(probe).color;
    sampleContext.fillRect(0, 0, 1, 1);
    return Array.from(sampleContext.getImageData(0, 0, 1, 1).data).slice(0, 3);
  }

  function readTheme() {
    background = color('--background');
    foreground = color('--foreground');
    dark = background[0] * 0.2126 + background[1] * 0.7152 + background[2] * 0.0722 < 130;
    const blue = color('--blue');
    const green = color('--green');
    const purple = color('--purple');
    const red = color('--red');
    const orange = color('--orange');
    const yellow = color('--yellow');
    palette = [
      mix(blue, green, 0.48),
      blue,
      purple,
      mix(red, purple, 0.18),
      orange,
      mix(yellow, orange, 0.28),
      mix(blue, green, 0.48)
    ].map(c => mix(c, foreground, dark ? 0.16 : 0.05));
    buildBackdrop();
    requestDraw();
  }

  // A deterministic wash of tiny ink/grain marks is generated once per size.
  function buildBackdrop() {
    if (!width) return;
    backdrop = document.createElement('canvas');
    backdrop.width = canvas.width;
    backdrop.height = canvas.height;
    const b = backdrop.getContext('2d');
    b.scale(dpr, dpr);
    b.fillStyle = rgb(background);
    b.fillRect(0, 0, width, height);
    const halo = b.createRadialGradient(width * 0.49, height * 0.49, 0, width * 0.49, height * 0.49, width * 0.52);
    halo.addColorStop(0, rgb(palette[2], dark ? 0.065 : 0.035));
    halo.addColorStop(0.64, rgb(palette[0], dark ? 0.025 : 0.012));
    halo.addColorStop(1, rgb(background, 0));
    b.fillStyle = halo;
    b.fillRect(0, 0, width, height);
    let seed = 531;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    };
    for (let i = 0; i < 7500; i++) {
      b.fillStyle = rgb(foreground, random() * (dark ? 0.035 : 0.025));
      b.fillRect(random() * width, random() * height, 0.65, 0.65);
    }
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, box.width);
    const nextHeight = Math.max(1, box.height);
    const nextDpr = Math.min(devicePixelRatio || 1, 2);
    if (width === nextWidth && height === nextHeight && dpr === nextDpr) return;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    buildBackdrop();
    requestDraw();
  }

  function paint() {
    if (!width || !palette || !backdrop) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(backdrop, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = Math.min(width, height) * 0.275;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const tilt = 0.50 + pointerY * 0.48 + 0.07 * Math.sin(phase * 0.24);
    const yaw = -0.20 + pointerX * 0.54;
    const roll = -0.32 + 0.065 * Math.sin(phase * 0.16);
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const cr = Math.cos(roll), sr = Math.sin(roll);

    // The torus's small cross-section twists as it travels around its center.
    // Harmonics wrinkle it like silk. Every strand is a separate closed curve.
    const curves = [];
    for (let n = 0; n < strands; n++) {
      const v = n / strands * TAU;
      const points = new Float32Array((samples + 1) * 2);
      let depth = 0;
      for (let j = 0; j <= samples; j++) {
        const a = ring[j];
        const u = a.angle;
        const twist = v + 3 * u + 0.46 * Math.sin(3 * u + phase * 0.16);
        const fold = 0.34 + 0.10 * Math.sin(3 * u - phase * 0.19) + 0.038 * Math.cos(7 * u + v * 2);
        const rim = 1.16 + 0.105 * Math.sin(3 * u + phase * 0.13) + 0.032 * Math.cos(9 * u - v);
        const radius = rim + fold * Math.cos(twist);
        const x = radius * a.cos;
        const y = radius * a.sin;
        const z = fold * Math.sin(twist) + 0.23 * Math.sin(2 * u + phase * 0.12);
        const yy = y * ct - z * st;
        const zz = y * st + z * ct;
        const xx = x * ca + zz * sa;
        const depthZ = -x * sa + zz * ca;
        const perspective = 5 / (5 - depthZ);
        points[j * 2] = cx + (xx * cr - yy * sr) * scale * perspective;
        points[j * 2 + 1] = cy + (xx * sr + yy * cr) * scale * perspective;
        depth += depthZ;
      }
      curves.push({ points, depth: depth / samples, v, n });
    }
    curves.sort((a, b) => a.depth - b.depth);

    const gradient = ctx.createLinearGradient(cx - scale * 1.5, cy + scale * 0.6, cx + scale * 1.35, cy - scale * 0.7);
    palette.forEach((c, i) => gradient.addColorStop(i / (palette.length - 1), rgb(c)));
    ctx.strokeStyle = gradient;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = dark ? 'screen' : 'multiply';

    for (const curve of curves) {
      const p = curve.points;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      for (let j = 2; j < p.length; j += 2) ctx.lineTo(p[j], p[j + 1]);
      ctx.closePath();
      const shimmer = 0.5 + 0.5 * Math.cos(curve.v * 3 + phase * 0.1);
      ctx.lineWidth = Math.max(0.35, width / 1200) * (curve.n % 11 === 0 ? 1.3 : 0.8);
      ctx.globalAlpha = (dark ? 0.25 : 0.18) + shimmer * (dark ? 0.24 : 0.2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function tick(now) {
    frame = 0;
    if (disposed || !root.isConnected) { dispose(); return; }
    if (!inView || document.hidden) { lastTick = 0; return; }
    const dt = lastTick ? Math.min((now - lastTick) / 1000, 0.07) : 1 / 30;
    lastTick = now;
    if (!paused) phase += dt;
    const ease = 1 - Math.exp(-dt * 4);
    pointerX += (targetX - pointerX) * ease;
    pointerY += (targetY - pointerY) * ease;
    paint();
    if (!paused || Math.abs(targetX - pointerX) + Math.abs(targetY - pointerY) > 0.002) requestDraw();
    else lastTick = 0;
  }

  function requestDraw() {
    if (!disposed && !frame && inView && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function updateButton() {
    button.textContent = paused ? 'Play' : 'Pause';
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
  }

  button.addEventListener('click', () => {
    paused = !paused;
    status.textContent = paused ? 'Animation paused.' : 'Animation playing.';
    updateButton();
    requestDraw();
  });
  canvas.addEventListener('pointermove', event => {
    const box = canvas.getBoundingClientRect();
    targetX = (event.clientX - box.left) / box.width * 2 - 1;
    targetY = (event.clientY - box.top) / box.height * 2 - 1;
    if (reducedMotion.matches) { pointerX = targetX; pointerY = targetY; }
    requestDraw();
  });
  canvas.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    if (reducedMotion.matches) pointerX = pointerY = 0;
    requestDraw();
  });
  function visibilityChanged() { lastTick = 0; requestDraw(); }
  function motionChanged() {
    paused = reducedMotion.matches;
    updateButton();
    requestDraw();
  }

  const resizeObserver = new ResizeObserver(resize);
  const themeObserver = new MutationObserver(readTheme);
  const intersectionObserver = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    lastTick = 0;
    requestDraw();
  });
  function dispose() {
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    themeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', visibilityChanged);
    scheme.removeEventListener('change', readTheme);
    reducedMotion.removeEventListener('change', motionChanged);
  }

  readTheme();
  resize();
  updateButton();
  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
  scheme.addEventListener('change', readTheme);
  reducedMotion.addEventListener('change', motionChanged);
  document.addEventListener('visibilitychange', visibilityChanged);
})();
