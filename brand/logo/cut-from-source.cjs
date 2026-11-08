const sharp = require(process.cwd() + '/node_modules/sharp');
// Usage: node brand/logo/cut-from-source.cjs <dir containing logo-src.jpg>  (writes <dir>/logo/*.png)
const S = process.argv[2];
// Key out the grey backdrop: keep saturated pixels (blue W, red dot) and dark
// pixels (black wordmark); everything light and grey becomes transparent.
async function cutout(region, out, { scale = 2 } = {}) {
  const { data, info } = await sharp(S + '/logo-src.jpg').extract(region).raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 510, sat = max === 0 ? 0 : (max - min) / max;
    // alpha ramps: strongly coloured or dark -> opaque; light grey -> clear
    const aSat = Math.min(1, Math.max(0, (sat - 0.18) / 0.22));
    const aDark = Math.min(1, Math.max(0, (0.5 - l) / 0.15));
    const a = Math.max(aSat, aDark);
    rgba[j] = r; rgba[j + 1] = g; rgba[j + 2] = b; rgba[j + 3] = Math.round(a * 255);
  }
  const img = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
  const trimmed = await img.trim({ threshold: 1 }).toBuffer();
  const m = await sharp(trimmed).metadata();
  await sharp(trimmed).resize(Math.round(m.width * scale), Math.round(m.height * scale), { kernel: 'lanczos3' }).png().toFile(out);
  const mm = await sharp(out).metadata();
  console.log(out.split('/').pop(), mm.width + 'x' + mm.height);
}
(async () => {
  await cutout({ left: 190, top: 190, width: 700, height: 640 }, S + '/logo/wangjia-logo.png');   // mark + wordmark
  await cutout({ left: 190, top: 190, width: 700, height: 536 }, S + '/logo/wangjia-mark.png');   // W + red dot
  await cutout({ left: 190, top: 730, width: 700, height: 100 }, S + '/logo/wangjia-wordmark.png', { scale: 2 });
  // preview on white and on brand blue
  const logo = await sharp(S + '/logo/wangjia-logo.png').resize(500).toBuffer();
  const mark = await sharp(S + '/logo/wangjia-mark.png').resize(300).toBuffer();
  await sharp({ create: { width: 1100, height: 520, channels: 4, background: '#ffffff' } })
    .composite([{ input: logo, left: 20, top: 20 }, { input: mark, left: 600, top: 60 },
      { input: await sharp({ create: { width: 1100, height: 120, channels: 4, background: '#0193DE' } }).png().toBuffer(), left: 0, top: 400 },
      { input: await sharp(S + '/logo/wangjia-logo.png').resize(null, 100).toBuffer(), left: 20, top: 410 }])
    .png().toFile(S + '/logo/preview.png');
})();
