const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const pngToIco = require('png-to-ico');

const rootDir = process.cwd();
const buildDir = path.join(rootDir, 'build');
const linuxIconsDir = path.join(buildDir, 'icons');
const publicIconsDir = path.join(rootDir, 'public', 'icons');
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(linuxIconsDir, { recursive: true });
fs.mkdirSync(publicIconsDir, { recursive: true });

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const appVersion = String(pkg.version || '1.1.0');

function encodeBmp24(rgbaBuffer, width, height) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const out = Buffer.alloc(fileSize);

  out.write('BM', 0, 2, 'ascii');
  out.writeUInt32LE(fileSize, 2);
  out.writeUInt32LE(0, 6);
  out.writeUInt32LE(54, 10);

  out.writeUInt32LE(40, 14);
  out.writeInt32LE(width, 18);
  out.writeInt32LE(height, 22);
  out.writeUInt16LE(1, 26);
  out.writeUInt16LE(24, 28);
  out.writeUInt32LE(0, 30);
  out.writeUInt32LE(pixelArraySize, 34);
  out.writeInt32LE(2835, 38);
  out.writeInt32LE(2835, 42);
  out.writeUInt32LE(0, 46);
  out.writeUInt32LE(0, 50);

  for (let y = 0; y < height; y++) {
    const srcRow = height - 1 - y;
    const dstOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const si = (srcRow * width + x) * 4;
      const di = dstOffset + x * 3;
      out[di] = rgbaBuffer[si + 2];
      out[di + 1] = rgbaBuffer[si + 1];
      out[di + 2] = rgbaBuffer[si];
    }
  }
  return out;
}

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#142331" />
  <rect x="2" y="2" width="60" height="60" rx="12" stroke="#38C6BA" stroke-width="2.5" />
  <path d="M18 22H26C26 19.2 28.2 17 31 17C33.8 17 36 19.2 36 22H44C45.7 22 47 23.3 47 25V33C49.8 33 52 35.2 52 38C52 40.8 49.8 43 47 43V47C47 48.7 45.7 50 44 50H18C16.3 50 15 48.7 15 47V25C15 23.3 16.3 22 18 22Z" fill="#38C6BA" />
  <rect x="21" y="29" width="8" height="8" rx="2" fill="#F5F2E9" />
  <rect x="33" y="29" width="8" height="8" rx="2" fill="#142331" />
  <rect x="21" y="40" width="8" height="5" rx="1.5" fill="#A8E5D5" />
</svg>`;

const MASKABLE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" fill="#142331" />
  <g transform="translate(8, 8) scale(0.75)">
    <rect x="4" y="4" width="56" height="56" rx="12" fill="#1C2D3B" stroke="#38C6BA" stroke-width="2.5" />
    <path d="M18 22H26C26 19.2 28.2 17 31 17C33.8 17 36 19.2 36 22H44C45.7 22 47 23.3 47 25V33C49.8 33 52 35.2 52 38C52 40.8 49.8 43 47 43V47C47 48.7 45.7 50 44 50H18C16.3 50 15 48.7 15 47V25C15 23.3 16.3 22 18 22Z" fill="#38C6BA" />
    <rect x="21" y="29" width="8" height="8" rx="2" fill="#F5F2E9" />
    <rect x="33" y="29" width="8" height="8" rx="2" fill="#142331" />
    <rect x="21" y="40" width="8" height="5" rx="1.5" fill="#A8E5D5" />
  </g>
</svg>`;

const HEADER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 57">
  <rect width="150" height="57" fill="#142331" />
  <rect x="0" y="54" width="150" height="3" fill="#38C6BA" />
  <g transform="translate(12, 10)">
    <rect width="36" height="36" rx="8" fill="#1C2D3B" stroke="#38C6BA" stroke-width="1.5" />
    <path d="M10 12H15C15 10.4 16.2 9 17.8 9C19.4 9 20.6 10.4 20.6 12H25C26 12 26.8 12.8 26.8 13.8V18.5C28.4 18.5 29.6 19.7 29.6 21.3C29.6 22.9 28.4 24.1 26.8 24.1V26.5C26.8 27.5 26 28.3 25 28.3H10C9 28.3 8.2 27.5 8.2 26.5V13.8C8.2 12.8 9 12 10 12Z" fill="#38C6BA" />
    <rect x="11.5" y="16" width="4.5" height="4.5" rx="1" fill="#F5F2E9" />
    <rect x="18.5" y="16" width="4.5" height="4.5" rx="1" fill="#142331" />
  </g>
  <text x="58" y="28" fill="#F5F7F8" font-family="Segoe UI, sans-serif" font-size="14" font-weight="700">PuzzleVerse</text>
  <text x="58" y="42" fill="#A8E5D5" font-family="Segoe UI, sans-serif" font-size="8.5" font-weight="600">Desktop v${appVersion}</text>
</svg>`;

const SIDEBAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 164 314">
  <rect width="164" height="314" fill="#142331" />
  <circle cx="140" cy="40" r="70" fill="#1C2D3B" />
  <rect x="0" y="308" width="164" height="6" fill="#38C6BA" />
  <g transform="translate(46, 52)">
    <rect width="72" height="72" rx="16" fill="#1C2D3B" stroke="#38C6BA" stroke-width="2" />
    <path d="M20 25H29C29 21.8 31.5 19.3 34.6 19.3C37.7 19.3 40.2 21.8 40.2 25H49C50.9 25 52.4 26.5 52.4 28.4V37.2C55.5 37.2 58 39.7 58 42.8C58 45.9 55.5 48.4 52.4 48.4V53C52.4 54.9 50.9 56.4 49 56.4H20C18.1 56.4 16.6 54.9 16.6 53V28.4C16.6 26.5 18.1 25 20 25Z" fill="#38C6BA" />
    <rect x="23" y="32.5" width="9" height="9" rx="2" fill="#F5F2E9" />
    <rect x="36.5" y="32.5" width="9" height="9" rx="2" fill="#142331" />
    <rect x="23" y="45" width="9" height="5.5" rx="1.5" fill="#A8E5D5" />
  </g>
  <text x="82" y="156" text-anchor="middle" fill="#F5F7F8" font-family="Segoe UI, sans-serif" font-size="18" font-weight="800">PuzzleVerse</text>
  <text x="82" y="176" text-anchor="middle" fill="#A8E5D5" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="600">Challenge Your Mind.</text>
  <text x="82" y="190" text-anchor="middle" fill="#A8E5D5" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="600">Beat Your Best.</text>
  <rect x="22" y="218" width="120" height="56" rx="10" fill="#1C2D3B" stroke="#36515F" stroke-width="1" />
  <text x="82" y="241" text-anchor="middle" fill="#F5F2E9" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700">16 Handcrafted Puzzles</text>
  <text x="82" y="258" text-anchor="middle" fill="#93D1F2" font-family="Segoe UI, sans-serif" font-size="9">Online &amp; Offline Play</text>
</svg>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1100,
    height: 1100,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  await win.loadURL('data:text/html,<html><body></body></html>');

  async function renderSvgToRgbaAndPng(svgString, width, height) {
    const dataUrl = await win.webContents.executeJavaScript(`
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = ${width};
          canvas.height = ${height};
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, ${width}, ${height});
          window.__lastRgba = Array.from(ctx.getImageData(0, 0, ${width}, ${height}).data);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('SVG load error'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(${JSON.stringify(svgString)});
      })
    `);
    const rgbaArr = await win.webContents.executeJavaScript('window.__lastRgba');
    const base64 = dataUrl.split(',')[1];
    return {
      png: Buffer.from(base64, 'base64'),
      rgba: Buffer.from(rgbaArr),
    };
  }

  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  for (const s of icoSizes) {
    const { png } = await renderSvgToRgbaAndPng(ICON_SVG, s, s);
    pngBuffers.push(png);
    fs.writeFileSync(path.join(linuxIconsDir, `${s}x${s}.png`), png);
    if (s === 256) {
      fs.writeFileSync(path.join(buildDir, 'icon-256.png'), png);
    }
    if (s === 64) {
      fs.writeFileSync(path.join(publicIconsDir, 'pwa-64x64.png'), png);
    }
  }

  const { png: png192 } = await renderSvgToRgbaAndPng(ICON_SVG, 192, 192);
  fs.writeFileSync(path.join(publicIconsDir, 'pwa-192x192.png'), png192);

  const { png: png512 } = await renderSvgToRgbaAndPng(ICON_SVG, 512, 512);
  fs.writeFileSync(path.join(buildDir, 'icon.png'), png512);
  fs.writeFileSync(path.join(buildDir, 'icon-512.png'), png512);
  fs.writeFileSync(path.join(linuxIconsDir, '512x512.png'), png512);
  fs.writeFileSync(path.join(publicIconsDir, 'pwa-512x512.png'), png512);

  const { png: mask512 } = await renderSvgToRgbaAndPng(MASKABLE_ICON_SVG, 512, 512);
  fs.writeFileSync(path.join(publicIconsDir, 'maskable-icon-512x512.png'), mask512);

  const { png: apple180 } = await renderSvgToRgbaAndPng(MASKABLE_ICON_SVG, 180, 180);
  fs.writeFileSync(path.join(publicIconsDir, 'apple-touch-icon-180x180.png'), apple180);

  const { png: icon1024 } = await renderSvgToRgbaAndPng(ICON_SVG, 1024, 1024);
  fs.writeFileSync(path.join(publicIconsDir, 'icon-1024x1024.png'), icon1024);

  const icoConverter = typeof pngToIco === 'function' ? pngToIco : pngToIco.default;
  const icoBuf = await icoConverter(pngBuffers);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);

  const headerRender = await renderSvgToRgbaAndPng(HEADER_SVG, 150, 57);
  fs.writeFileSync(path.join(buildDir, 'installerHeader.bmp'), encodeBmp24(headerRender.rgba, 150, 57));

  const sidebarRender = await renderSvgToRgbaAndPng(SIDEBAR_SVG, 164, 314);
  fs.writeFileSync(path.join(buildDir, 'installerSidebar.bmp'), encodeBmp24(sidebarRender.rgba, 164, 314));

  console.log('Generated desktop, Linux, and PWA icons cleanly in build/ and public/icons/');
  app.quit();
});
