(() => {
  'use strict';

  // An original code-drawn ink study. No bitmap is embedded or sampled.
  // Visual reference: Debbie Rowe / The Royal Society, 2018.
  // https://commons.wikimedia.org/wiki/File:Elon_Musk_Royal_Society_(crop2).jpg
  // Portrait adaptation: CC BY-SA 3.0.
  // All geometry, hair strokes, hatching, and miniature ink gestures live here.

  const root = document.getElementById('elon-ink-study');
  const viewer = window.CanvasArtViewer.create(root, { width: 420, height: 510 });
  if (!viewer) return;
  const ctx = viewer.context;
  ctx.translate(-430, 12);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let seed = 81273;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  }
  const between = (a, b) => a + random() * (b - a);
  const path = data => new Path2D(data);
  let fragmentFeatures = false;
  function fill(data, opacity = 1, color = '#111') {
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.fill(typeof data === 'string' ? path(data) : data);
    ctx.globalAlpha = 1;
  }
  function line(data, width = 0.7, opacity = 1, color = '#111') {
    ctx.lineWidth = width;
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    // Short omissions interrupt the anatomy under magnification. The gaps
    // belong to the drawing, so changing the zoom never changes its geometry.
    if (fragmentFeatures) ctx.setLineDash([2.6, 0.6, 5.1, 0.8, 1.4, 0.45]);
    ctx.stroke(typeof data === 'string' ? path(data) : data);
    if (fragmentFeatures) ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  function ellipse(x, y, rx, ry, color = '#111', opacity = 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // A pen hatch is clipped to its hand-defined plane, never to an image.
  function hatch(shape, spacing = 3, angle = -0.6, opacity = 0.24, weight = 0.36) {
    ctx.save();
    ctx.clip(typeof shape === 'string' ? path(shape) : shape);
    ctx.translate(640, 265);
    ctx.rotate(angle);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = weight;
    ctx.globalAlpha = opacity;
    for (let y = -570; y < 570; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(-580, y);
      ctx.bezierCurveTo(-200, y + between(-2, 2), 200, y + between(-2, 2), 580, y + between(-0.7, 0.7));
      ctx.stroke();
    }
    ctx.restore();
  }

  // Analytic shadow fields: x, y, spread x, spread y, darkness.
  // At portrait scale these fields describe facial planes. Up close, each
  // mark is an unrelated open loop, hooked stroke, or little wandering line.
  // Their size is fixed in the artwork, not in screen pixels.
  function microInk(shape, bounds, fields, count, base = 0.01, radius = 0.43) {
    ctx.save();
    ctx.clip(typeof shape === 'string' ? path(shape) : shape);
    ctx.strokeStyle = '#080808';
    const [x0, y0, w, h] = bounds;
    for (let i = 0; i < count * 0.22; i++) {
      const x = x0 + random() * w;
      const y = y0 + random() * h;
      let darkness = base;
      for (const [cx, cy, sx, sy, amount] of fields) {
        const dx = (x - cx) / sx, dy = (y - cy) / sy;
        darkness += Math.exp(-0.5 * (dx * dx + dy * dy)) * amount;
      }
      if (random() > darkness) continue;
      const r = radius * between(2.3, 6.1);
      const angle = Math.sin(x * 0.065) + Math.cos(y * 0.045) + between(-1.1, 1.1);
      const c = Math.cos(angle), s = Math.sin(angle);
      const point = (u, v) => [x + r * (u * c - v * s), y + r * (u * s + v * c)];
      const kind = Math.floor(random() * 3);
      ctx.globalAlpha = between(0.38, 0.82);
      ctx.lineWidth = Math.max(0.1, radius * between(0.38, 0.70));
      ctx.beginPath();
      if (kind === 0) {
        ctx.moveTo(...point(-0.95, -0.2));
        ctx.bezierCurveTo(...point(0.8, -1.2), ...point(1.2, 0.5), ...point(0.1, 0.65));
        ctx.bezierCurveTo(...point(-0.55, 0.8), ...point(-0.75, -0.05), ...point(0.2, -0.08));
      } else if (kind === 1) {
        ctx.moveTo(...point(-1, 0.45));
        ctx.bezierCurveTo(...point(-0.65, -1), ...point(-0.1, 1.1), ...point(0.2, -0.3));
        ctx.bezierCurveTo(...point(0.4, -0.9), ...point(0.7, -0.6), ...point(1, 0.15));
      } else {
        ctx.moveTo(...point(-0.8, 0.6));
        ctx.lineTo(...point(-0.2, -0.6));
        ctx.bezierCurveTo(...point(1.1, -0.5), ...point(0.7, 0.7), ...point(0.1, 0.2));
        ctx.moveTo(...point(0.6, 0.9));
        ctx.lineTo(...point(1, 0.55));
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  const neck = path('M559 364 C565 389 561 403 551 420 L556 467 C582 489 607 502 643 508 C681 496 722 469 753 439 C756 407 752 382 741 356 L696 373 Z');
  const face = path('M522 167 C528 130 549 103 581 94 C611 86 653 83 688 90 C722 94 737 119 744 151 C751 181 753 211 748 238 L747 282 C749 311 746 335 736 357 C723 384 699 405 673 419 C653 429 637 433 615 426 C589 420 564 405 549 386 C532 366 526 346 524 322 L520 276 C514 250 515 217 518 195 Z');
  const hair = path('M521 276 C510 263 511 247 511 230 C507 215 505 198 506 182 C501 167 498 156 498 142 L490 138 L498 127 L481 131 L491 120 L475 116 C489 117 493 109 499 103 L501 88 L510 90 C516 75 522 73 530 75 C527 68 529 62 535 60 L541 65 C536 49 541 41 548 39 C556 36 561 42 565 49 C568 36 576 37 580 41 C585 22 596 17 605 29 C611 20 622 18 631 24 C640 18 646 21 653 26 C665 21 677 23 685 28 C699 21 712 27 722 40 L718 29 C730 36 736 50 738 66 C748 70 755 73 762 80 L782 76 L776 86 L793 87 L781 98 L798 101 L785 107 L800 111 L786 119 L793 124 L783 134 L788 143 L780 152 C783 169 777 184 772 199 L770 220 L763 234 L756 256 L746 276 L743 259 L747 234 C748 218 744 204 744 191 C738 177 738 160 731 142 C726 124 716 110 700 101 C681 92 658 90 639 94 C617 94 598 95 579 102 C561 108 546 122 537 142 C529 160 526 180 523 199 L524 224 L526 247 Z');

  // Dark tailoring anchors the portrait without taking attention from the face.
  const jacket = path('M560 387 C552 404 541 411 521 418 C489 430 459 443 427 460 L405 505 L870 505 L862 450 C824 432 794 421 779 409 C765 395 754 380 746 361 C755 395 754 427 746 459 L723 505 L550 505 C548 468 550 426 560 387 Z');
  fill(jacket, 1, '#101010');
  hatch(jacket, 2.1, 0.28, 0.22, 0.45);
  line('M543 415 C523 440 502 470 490 507 M780 415 C806 452 818 478 824 509', 0.7, 0.5, '#fff');

  fill(neck, 1, '#fff');
  microInk(neck, [543, 359, 217, 149], [
    [629, 420, 77, 22, 0.57], [587, 438, 33, 31, 0.35],
    [707, 426, 26, 42, 0.20], [649, 482, 25, 30, 0.14]
  ], 21000, 0.025, 0.43);
  hatch('M559 383 C588 416 620 436 652 432 C690 425 720 401 740 376 L732 407 C704 435 677 449 643 451 C609 448 580 435 557 418 Z', 3.4, -0.40, 0.23, 0.4);

  const leftEar = path('M522 223 C513 215 508 220 509 238 C507 251 512 267 518 277 L528 288 L533 256 Z');
  const rightEar = path('M748 230 C756 216 765 214 772 221 C780 237 775 251 772 269 C770 287 762 303 750 310 L742 311 L742 280 Z');
  fill(leftEar, 1, '#fff');
  fill(rightEar, 1, '#fff');
  microInk(rightEar, [738, 214, 44, 101], [[758, 258, 15, 35, 0.35], [747, 282, 10, 20, 0.35]], 6500, 0.05, 0.4);
  line('M754 236 C761 224 769 226 769 239 C772 250 765 265 764 278 C761 291 758 296 750 300', 0.8, 0.7);
  line('M759 239 C751 250 755 259 754 266 C748 260 745 264 747 273 C752 275 754 279 750 284', 1.0, 0.6);
  line('M772 239 C775 263 766 294 752 305', 0.6, 0.7);

  // White facial planes with ink marks, followed by finer features.
  fill(face, 1, '#fff');
  microInk(face, [511, 83, 247, 357], [
    [533, 174, 19, 76, 0.20], [538, 286, 28, 80, 0.35],
    [556, 354, 22, 39, 0.12], [550, 387, 30, 22, 0.29],
    [603, 416, 44, 12, 0.35], [657, 420, 43, 14, 0.41],
    [723, 345, 20, 52, 0.19], [742, 281, 13, 70, 0.14],
    [589, 111, 46, 17, 0.06], [716, 161, 15, 34, 0.07],
    [568, 220, 28, 10, 0.23], [567, 247, 25, 8, 0.20],
    [667, 216, 24, 10, 0.20], [669, 245, 30, 8, 0.16],
    [599, 260, 8, 34, 0.25], [601, 295, 10, 13, 0.23],
    [618, 304, 16, 7, 0.30], [641, 295, 7, 9, 0.21],
    [565, 324, 7, 18, 0.12], [580, 347, 9, 18, 0.16],
    [684, 327, 6, 15, 0.13], [673, 350, 7, 11, 0.12],
    [625, 376, 30, 9, 0.17], [609, 324, 5, 12, 0.1]
  ], 185000, 0.006, 0.24);

  hatch('M523 177 C531 149 540 132 550 122 C534 173 535 207 539 231 C541 255 531 273 533 300 C535 331 544 352 558 370 C540 355 527 333 524 309 Z', 2.6, -0.64, 0.22, 0.34);
  hatch('M527 316 C536 353 552 380 580 397 C601 411 625 418 642 420 C674 417 707 394 725 373 C710 400 678 423 650 429 C617 435 580 417 553 390 C534 370 525 346 527 316 Z', 2.8, -0.55, 0.28, 0.4);
  hatch('M600 239 C596 258 598 273 592 286 C589 295 593 302 601 306 L608 305 C599 299 598 294 603 284 C606 271 605 254 608 242 Z', 2.4, 0.35, 0.20, 0.3);

  // The hair silhouette is intentionally asymmetric, as in the reference.
  fill(hair);
  ctx.save();
  ctx.clip(hair);
  // Swept top: fine highlights follow the curvature of individual locks.
  for (let i = 0; i < 210; i++) {
    const t = i / 209;
    const x = 532 + 207 * t;
    const y = 143 - 51 * Math.sin(t * Math.PI * 0.90) + 10 * t;
    const dx = -10 - 29 * Math.sin(t * Math.PI);
    ctx.beginPath();
    ctx.moveTo(x + between(-1.1, 1.1), y + between(-5, 6));
    ctx.bezierCurveTo(x + 15 + dx, y - 36, x + dx + between(-13, 4), 8 + 12 * t, x + dx - 10, 20 + 13 * t + between(-13, 13));
    ctx.strokeStyle = '#fff';
    ctx.globalAlpha = between(0.06, 0.29);
    ctx.lineWidth = between(0.26, 0.66);
    ctx.stroke();
  }
  // Side sweep and sideburns.
  for (let i = 0; i < 86; i++) {
    const t = i / 85;
    const y = 99 + 169 * t;
    ctx.beginPath();
    ctx.moveTo(719 + 29 * Math.sin(t * Math.PI * 0.6), y);
    ctx.bezierCurveTo(735 + 24 * t, y + 1, 769 - 7 * t, y - 13, 793 - 43 * t, y - 19 + between(-3, 3));
    ctx.strokeStyle = '#fff';
    ctx.globalAlpha = between(0.10, 0.36);
    ctx.lineWidth = between(0.22, 0.68);
    ctx.stroke();
  }
  for (let i = 0; i < 75; i++) {
    const t = i / 74;
    const x = 490 + 66 * t;
    const y = 131 - 41 * t;
    ctx.beginPath();
    ctx.moveTo(524 + 19 * t, 227 - 89 * t);
    ctx.bezierCurveTo(508 + 22 * t, 177 - 44 * t, x - 6, y + 28, x + between(-4, 4), y);
    ctx.strokeStyle = '#fff';
    ctx.globalAlpha = between(0.08, 0.27);
    ctx.lineWidth = between(0.23, 0.7);
    ctx.stroke();
  }
  ctx.restore();
  // A few stray, tapering hairs keep the edge from reading as a helmet.
  const flyaways = [
    'M504 120 C489 119 479 117 472 109', 'M516 96 C516 83 525 71 527 71',
    'M546 68 C535 48 543 32 554 37', 'M558 71 C548 52 553 36 562 40',
    'M582 48 C578 32 594 12 607 22', 'M592 46 C597 22 611 15 621 20',
    'M621 47 C633 20 648 23 654 29', 'M703 74 C710 51 706 31 697 27',
    'M719 81 C732 65 728 39 722 31', 'M730 92 C744 69 738 50 735 45',
    'M746 101 C765 99 781 91 789 82', 'M754 129 C779 128 789 122 797 122',
    'M759 145 C780 141 790 139 796 133', 'M512 216 C505 234 511 260 516 267'
  ];
  flyaways.forEach((p, i) => line(p, i % 3 === 0 ? 0.52 : 0.36, 0.65));

  // Forehead and brow: small, broken lines rather than a heavy outline.
  fragmentFeatures = true;
  line('M575 128 C603 117 643 115 673 122', 0.33, 0.20);
  line('M579 153 C607 145 641 144 666 148', 0.28, 0.18);
  line('M614 183 C611 194 615 206 616 216', 0.52, 0.28);
  line('M624 189 C621 198 622 205 623 211', 0.4, 0.2);

  const browLeft = 'M540 211 C554 205 569 205 581 209 L595 216 L591 219 C576 212 559 211 542 214 Z';
  const browRight = 'M642 213 C657 205 671 202 683 203 C693 204 701 208 705 212 L699 213 C683 209 670 208 657 212 L643 216 Z';
  hatch(browLeft, 0.75, -0.35, 0.45, 0.4);
  hatch(browRight, 0.75, 0.35, 0.42, 0.4);
  for (let i = 0; i < 78; i++) {
    const t = i / 77;
    let x = 543 + t * 50;
    let y = 213 - 3 * Math.sin(t * Math.PI) + 4 * t;
    line(`M${x} ${y + between(-0.7, 1.5)} q${between(-2, 2)} ${between(-2, -5)} ${between(1, 4)} ${between(-4, -7)}`, between(0.3, 0.63), between(0.3, 0.65));
    x = 643 + t * 58;
    y = 215 - 6 * Math.sin(t * Math.PI) - 2 * t;
    line(`M${x} ${y + between(-1, 1)} q${between(1, 3)} -4 ${between(2, 5)} ${between(-3, -6)}`, between(0.26, 0.56), between(0.30, 0.62));
  }

  // Eye sockets and the characteristic hooded eyelids.
  hatch('M545 225 C557 216 580 216 594 230 L597 240 C584 231 561 228 545 236 Z', 2.0, -0.33, 0.24, 0.30);
  hatch('M639 224 C654 216 678 215 693 225 L697 235 C680 229 658 228 641 235 Z', 2.0, 0.2, 0.20, 0.3);

  function eye(outline, x, y, radius, top, lower, crease) {
    const mask = path(outline);
    fill(mask, 1, '#fff');
    ctx.save();
    ctx.clip(mask);
    // Radial pen strokes form the iris instead of a smooth gray disk.
    for (let k = 0; k < 34; k++) {
      const a = k / 34 * Math.PI * 2;
      const r = radius * 0.58;
      line(`M${x + Math.cos(a) * r} ${y + Math.sin(a) * r} Q${x + Math.cos(a + 0.3) * radius} ${y + Math.sin(a + 0.3) * radius} ${x + Math.cos(a) * radius} ${y + Math.sin(a) * radius}`, 0.48, 0.63);
    }
    ellipse(x, y, radius * 0.32, radius * 0.36);
    ellipse(x - 2.4, y - 2.2, 1.6, 1.35, '#fff');
    ellipse(x + 2, y + 2, 0.65, 0.65, '#fff', 0.8);
    ctx.restore();
    line(top, 1.15, 0.84);
    line(lower, 0.52, 0.49);
    line(crease, 0.65, 0.47);
  }
  eye(
    'M548 236 C560 231 579 231 593 237 C580 242 562 242 548 236 Z',
    571, 235, 7.3,
    'M548 236 C560 231 579 231 593 237',
    'M551 237 C565 243 583 242 591 239',
    'M545 230 C558 223 578 223 592 232'
  );
  eye(
    'M642 234 C656 229 677 228 693 233 C680 240 655 241 642 234 Z',
    666, 232.5, 7.5,
    'M642 234 C656 229 677 228 693 233',
    'M645 236 C658 242 680 240 690 235',
    'M641 226 C654 220 676 219 691 226'
  );
  line('M543 240 L536 244 M545 246 C554 252 576 255 589 248', 0.52, 0.38);
  line('M550 254 C562 260 577 257 586 253', 0.36, 0.3);
  line('M642 246 C658 253 679 249 691 242 M696 234 L703 232 M698 240 L707 244', 0.48, 0.34);
  line('M649 254 C667 259 684 252 692 248', 0.36, 0.26);

  // Bridge, bulb, nostrils, and the soft shadow beneath the nose.
  line('M607 235 C603 250 605 268 599 282 C594 291 592 297 598 302', 0.73, 0.48);
  line('M641 276 C641 283 646 287 647 294 C649 301 644 306 638 307', 0.65, 0.42);
  fill('M597 298 C600 293 605 296 609 300 C605 300 602 303 599 302 Z', 0.79);
  fill('M631 300 C636 295 642 294 646 299 C641 297 639 301 635 303 Z', 0.83);
  line('M605 305 C612 312 624 312 633 305', 0.90, 0.48);
  line('M612 289 C619 284 629 286 633 292', 0.38, 0.21);
  line('M610 313 C608 320 608 326 607 330 M627 313 C629 319 630 326 634 330', 0.42, 0.28);

  // Smile planes around the cheeks.
  line('M561 302 C556 313 560 326 570 334', 0.58, 0.28);
  line('M565 312 C566 323 570 332 576 337', 0.36, 0.31);
  line('M656 302 C669 308 678 318 683 330', 0.56, 0.28);
  line('M686 312 C693 322 691 333 687 340', 0.34, 0.19);
  line('M561 331 C565 341 568 347 577 351', 0.38, 0.30);

  // Lips: a quiet asymmetric smile, with a narrow sliver of teeth.
  const upperLip = 'M579 343 C594 339 605 336 615 337 C620 337 624 340 630 338 C645 336 664 337 680 338 C665 343 649 347 633 348 C612 348 594 346 579 345 Z';
  hatch(upperLip, 1.1, 0.75, 0.47, 0.42);
  const opening = 'M579 344 C598 342 615 342 631 343 C648 344 664 341 680 338 C669 346 651 353 632 353 C611 353 594 349 579 345 Z';
  fill(opening, 0.88);
  fill('M593 344 C608 343 625 344 638 345 C647 345 655 344 662 343 C652 349 619 351 598 347 Z', 1, '#fff');
  line('M607 344 L608 348 M621 345 L621 349 M635 346 L635 349', 0.28, 0.29);
  const lowerLip = 'M588 348 C606 354 617 356 632 355 C650 355 666 347 676 341 C666 355 650 362 634 363 C615 365 599 358 588 348 Z';
  microInk(lowerLip, [585, 342, 99, 28], [[626, 362, 30, 6, 0.46], [599, 352, 12, 9, 0.16]], 5200, 0.01, 0.28);
  line('M594 353 C605 361 619 365 634 363 C648 362 660 356 667 350', 0.60, 0.40);
  line('M609 357 C621 360 640 359 651 355', 0.52, 0.90, '#fff');
  line('M579 343 C576 344 576 347 579 349 M680 338 L684 339', 0.90, 0.62);

  // Lower face: a chin crease and irregular, extremely short stubble marks.
  line('M603 379 C618 384 639 383 653 377', 0.5, 0.24);
  line('M624 402 C631 405 641 405 647 401', 0.32, 0.21);
  ctx.save();
  ctx.clip(face);
  for (let i = 0; i < 2300; i++) {
    const x = between(532, 741), y = between(319, 432);
    const jaw = Math.exp(-Math.pow((y - 408) / 24, 2));
    const side = Math.exp(-Math.pow((x - 541) / 16, 2)) + Math.exp(-Math.pow((x - 730) / 15, 2));
    if (random() > 0.26 * jaw + 0.14 * side) continue;
    const direction = (x - 638) / 150;
    line(`M${x} ${y} l${direction * between(0.3, 1)} ${between(0.25, 0.7)}`, between(0.20, 0.41), between(0.2, 0.5));
  }
  ctx.restore();
  line('M525 308 C526 337 536 364 551 383 C568 404 593 419 616 425', 0.72, 0.66);
  line('M619 427 C636 432 653 429 672 420 C696 408 718 388 731 367', 0.64, 0.54);
  line('M740 344 C744 334 746 321 746 310', 0.52, 0.40);
  fragmentFeatures = false;

  // An uninterrupted shirt front closes beneath a V-shaped neck opening.
  // Draw the fabric over the lower neck marks before adding the two collar leaves.
  const shirtFront = 'M550 444 L585 439 L637 480 L696 434 L752 409 L747 514 L548 514 Z';
  fill(shirtFront, 1, '#fff');
  line('M585 439 L637 480 L696 434', 0.64, 0.46);

  // Folded collar leaves end in distinct points, with a slight asymmetry that
  // follows the head's angle. Their outer edges meet the jacket and shirt front.
  const collarLeft = 'M558 405 C554 420 551 434 550 447 L591 489 L612 459 C585 442 570 424 558 405 Z';
  const collarRight = 'M746 373 C754 393 755 416 750 435 L699 489 L681 455 C710 433 732 404 746 373 Z';
  fill(collarLeft, 1, '#fff');
  fill(collarRight, 1, '#fff');
  line('M558 405 C554 420 551 434 550 447 L591 489 L612 459 C585 442 570 424 558 405', 0.65, 0.59);
  line('M746 373 C754 393 755 416 750 435 L699 489 L681 455 C710 433 732 404 746 373', 0.65, 0.56);

  // Fine seams and narrow ink hatches describe the turned fabric; no gray washes.
  line('M554 447 L590 483 L607 460', 0.32, 0.33);
  line('M746 435 L700 483 L686 456', 0.32, 0.31);
  hatch('M550 447 L591 489 L587 490 L548 451 Z', 2.2, -0.35, 0.24, 0.3);
  hatch('M699 489 L681 455 L685 457 L701 484 Z', 2.2, 0.40, 0.22, 0.3);
  line('M637 480 C639 489 639 501 639 514 M644 480 L646 514', 0.52, 0.42);
  line('M558 470 C565 481 570 494 571 512 M737 457 C728 476 724 493 723 512', 0.40, 0.27);
  viewer.finish();
})();
