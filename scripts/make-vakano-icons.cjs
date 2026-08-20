const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SIZE = 1024;
const NAVY = [0x00, 0x23, 0x6f, 255];
const WHITE = [255, 255, 255, 255];
const OUT = path.join(__dirname, '..', 'assets', 'images');

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function vCoverage(x, y, pad) {
  const cx = SIZE / 2;
  const top = SIZE * (0.22 + pad);
  const bottom = SIZE * (0.78 - pad);
  const half = SIZE * (0.24 - pad * 0.4);
  const radius = SIZE * 0.078;
  const left = distToSegment(x, y, cx - half, top, cx, bottom);
  const right = distToSegment(x, y, cx + half, top, cx, bottom);
  const d = Math.min(left, right);
  const edge = 2.8;
  if (d <= radius - edge) return 1;
  if (d >= radius + edge) return 0;
  const t = (radius + edge - d) / (2 * edge);
  return t * t * (3 - 2 * t);
}

function makePng({ opaqueNavy, whiteOnTransparent }) {
  const png = new PNG({ width: SIZE, height: SIZE, colorType: 6 });
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cover = vCoverage(x + 0.5, y + 0.5, whiteOnTransparent ? 0.06 : 0.02);
      const i = (SIZE * y + x) << 2;
      if (opaqueNavy) {
        const a = cover;
        png.data[i] = Math.round(NAVY[0] * (1 - a) + WHITE[0] * a);
        png.data[i + 1] = Math.round(NAVY[1] * (1 - a) + WHITE[1] * a);
        png.data[i + 2] = Math.round(NAVY[2] * (1 - a) + WHITE[2] * a);
        png.data[i + 3] = 255;
      } else {
        png.data[i] = WHITE[0];
        png.data[i + 1] = WHITE[1];
        png.data[i + 2] = WHITE[2];
        png.data[i + 3] = Math.round(255 * cover);
      }
    }
  }
  return PNG.sync.write(png);
}

function solidNavy() {
  const png = new PNG({ width: SIZE, height: SIZE, colorType: 6 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = NAVY[0];
    png.data[i + 1] = NAVY[1];
    png.data[i + 2] = NAVY[2];
    png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
}

const full = makePng({ opaqueNavy: true, whiteOnTransparent: false });
const fg = makePng({ opaqueNavy: false, whiteOnTransparent: true });

fs.writeFileSync(path.join(OUT, 'icon.png'), full);
fs.writeFileSync(path.join(OUT, 'splash-icon.png'), full);
fs.writeFileSync(path.join(OUT, 'favicon.png'), full);
fs.writeFileSync(path.join(OUT, 'android-icon-foreground.png'), fg);
fs.writeFileSync(path.join(OUT, 'android-icon-monochrome.png'), fg);
fs.writeFileSync(path.join(OUT, 'android-icon-background.png'), solidNavy());
console.log('wrote Vakano icons to', OUT);
