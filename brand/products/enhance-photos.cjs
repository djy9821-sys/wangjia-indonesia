/*
  Product photo clean-up used for static/products/*.jpg:
    node brand/products/enhance-photos.cjs <in-dir> <out-dir>
  Cuts baked-in frames/captions (CUT), trims near-white borders (WHITE_BG),
  pads every photo to a 1200x1200 white square, and applies a light
  sharpen/contrast pass. Run from the repo root (uses the root sharp install).
*/
const path = require('path');
const sharp = require(path.join(process.cwd(), 'node_modules', 'sharp'));
const fs = require('fs');
const [IN = 'out', OUT = 'enh'] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const SIZE = 1200, PAD = 0.08;
// Images on a white/near-white background can be trimmed and re-padded;
// the rest (blue water / dark backgrounds) are only squared and cleaned up.
// Fractions to cut away first (baked-in frames and captions): [top,right,bottom,left]
const CUT = {
  'gear-set':[0.07,0.07,0.07,0.07], 'motor-1hp':[0.07,0.07,0.07,0.07],
  'impeller-kaki-bebek':[0.14,0,0,0], 'gearbox-stainless':[0,0,0.10,0], 'motor-2hp':[0.13,0,0,0],
  'kincir-1hp-toko':[0.09,0,0,0], 'gearbox-cast-iron':[0.16,0,0,0], 'impeller':[0,0,0.12,0],
  'impeller-uv':[0,0,0.24,0], 'kopel':[0,0,0.30,0.12], 'pelampung-uv':[0,0,0.25,0], 'pillow-block':[0,0,0.18,0],
};
const WHITE_BG = new Set(['kincir-1hp','kincir-1hp-oranye','kincir-2hp','kincir-2hp-oranye','kincir-yc055','impeller','impeller-kaki-bebek','gearbox-nylon','gearbox-stainless','gear-set','motor-1hp','motor-2hp','pelampung','penutup-motor','kopel-posisi','katalog-suku-cadang']);
(async () => {
  for (const f of fs.readdirSync(IN).filter(f => f.endsWith('.jpg'))) {
    const name = f.replace('.jpg','');
    let img = sharp(path.join(IN, f)).flatten({ background: '#fff' });
    if (CUT[name]) {
      const m = await img.metadata(); const [t,r,b,l] = CUT[name];
      const left = Math.round(m.width*l), top = Math.round(m.height*t);
      img = sharp(await img.extract({ left, top, width: Math.round(m.width*(1-l-r)), height: Math.round(m.height*(1-t-b)) }).toBuffer());
    }
    if (WHITE_BG.has(name)) {
      // drop near-white borders, then square with even padding
      img = sharp(await img.trim({ background: '#fff', threshold: 18 }).toBuffer());
    }
    const meta = await img.metadata();
    const side = Math.max(meta.width, meta.height);
    const inner = Math.round(SIZE * (1 - 2 * PAD));
    const scale = inner / side;
    const w = Math.round(meta.width * scale), h = Math.round(meta.height * scale);
    const bg = '#ffffff';
    const resized = await img
      .resize(w, h, { kernel: 'lanczos3' })
      .modulate({ brightness: 1.02, saturation: 1.06 })
      .linear(1.04, -4)               // mild contrast
      .sharpen({ sigma: 1.1, m1: 0.6, m2: 0.9 })
      .toBuffer();
    const info = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: bg } })
      .composite([{ input: resized, left: Math.round((SIZE - w) / 2), top: Math.round((SIZE - h) / 2) }])
      .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toFile(path.join(OUT, f));
    console.log(name.padEnd(22), `${meta.width}x${meta.height}`.padEnd(10), Math.round(info.size/1024)+'KB');
  }
})();
