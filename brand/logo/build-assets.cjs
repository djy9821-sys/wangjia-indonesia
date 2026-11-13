/*
  Builds every logo-derived asset from the transparent cut-outs in brand/logo:
    node brand/logo/build-assets.cjs
  Outputs: horizontal lockup, app icon/splash sources, storefront icons,
  favicon.ico and the Open Graph image. Run from the repo root.
*/
const path = require('path');
const fs = require('fs');
const sharp = require(path.join(process.cwd(), 'node_modules', 'sharp'));
const B = 'brand/logo';
const MARK = `${B}/wangjia-mark.png`, WORD = `${B}/wangjia-wordmark.png`, LOGO = `${B}/wangjia-logo.png`;
const BLUE = '#0193DE', WHITE = '#ffffff';

async function lockup(out, h = 400) {
  const mark = await sharp(MARK).resize({ height: h }).toBuffer();
  const mw = (await sharp(mark).metadata()).width;
  const word = await sharp(WORD).resize({ height: Math.round(h * 0.3) }).toBuffer();
  const wm = await sharp(word).metadata();
  const gap = Math.round(h * 0.1);
  await sharp({ create: { width: mw + gap + wm.width, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, left: 0, top: 0 }, { input: word, left: mw + gap, top: Math.round((h - wm.height) / 2) }])
    .png().toFile(out);
}
async function tile(out, size, markRatio, bg = WHITE) {
  const mark = await sharp(MARK).resize({ width: Math.round(size * markRatio) }).toBuffer();
  const m = await sharp(mark).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark, left: Math.round((size - m.width) / 2), top: Math.round((size - m.height) / 2) }])
    .png().toFile(out);
}
function ico(pngPath, out) {
  const png = fs.readFileSync(pngPath);
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header[6] = 32; header[7] = 32; header[8] = 0; header[9] = 0;
  header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  fs.writeFileSync(out, Buffer.concat([header, png]));
}
(async () => {
  await lockup(`${B}/wangjia-logo-horizontal.png`);
  // storefront
  fs.copyFileSync(`${B}/wangjia-logo-horizontal.png`, 'apps/storefront/public/wangjia-logo-horizontal.png');
  fs.copyFileSync(LOGO, 'apps/storefront/public/wangjia-logo.png');
  fs.copyFileSync(MARK, 'apps/storefront/public/wangjia-mark.png');
  await tile('apps/storefront/src/app/icon.png', 512, 0.78);
  await tile('apps/storefront/src/app/apple-icon.png', 180, 0.72);
  await tile(`${B}/favicon-32.png`, 32, 0.9);
  ico(`${B}/favicon-32.png`, 'apps/storefront/public/favicon.ico');
  // app: launcher icon, adaptive foreground (safe zone), splash
  await tile('apps/mobile/assets/brand/icon.png', 1024, 0.68);
  await tile('apps/mobile/assets/brand/icon-adaptive.png', 1024, 0.5, { r: 0, g: 0, b: 0, alpha: 0 });
  await tile('apps/mobile/assets/brand/splash.png', 1024, 0.5, { r: 0, g: 0, b: 0, alpha: 0 });
  // The app shows the mark 96 points wide at most: 384 px is sharp on any phone.
  await sharp(MARK).resize({ width: 384 }).png().toFile('apps/mobile/assets/brand/mark.png');
  // Open Graph 1200x630: lockup + tagline + product photo
  const lock = await sharp(`${B}/wangjia-logo-horizontal.png`).resize({ width: 560 }).toBuffer();
  const photo = await sharp('apps/backend/static/products/kincir-2hp.jpg').resize(430, 430).toBuffer();
  const text = Buffer.from(`<svg width="640" height="220" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="40" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#1E1A17">Kincir air / aerator tambak</text>
    <text x="0" y="90" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#1E1A17">udang &amp; ikan</text>
    <text x="0" y="145" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="${BLUE}">Toko resmi WANGJIA® Indonesia</text>
    <text x="0" y="180" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="${BLUE}">Suku cadang lengkap · garansi motor 1 tahun</text>
  </svg>`);
  const og = sharp({ create: { width: 1200, height: 630, channels: 3, background: WHITE } })
    .composite([{ input: lock, left: 70, top: 110 }, { input: text, left: 70, top: 300 }, { input: photo, left: 740, top: 100 }]);
  await og.clone().jpeg({ quality: 88 }).toFile('apps/storefront/src/app/opengraph-image.jpg');
  await og.clone().jpeg({ quality: 88 }).toFile('apps/storefront/src/app/twitter-image.jpg');
  await og.clone().png().toFile(`${B}/og-image.png`);
  console.log('assets built');
})();
