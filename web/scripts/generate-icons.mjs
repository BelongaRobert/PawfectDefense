import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });
mkdirSync('resources', { recursive: true });

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#245749"/>
      <stop offset="100%" stop-color="#1a3a32"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <circle cx="190" cy="210" r="34" fill="#e7f4ee"/>
  <circle cx="322" cy="210" r="34" fill="#e7f4ee"/>
  <circle cx="150" cy="300" r="28" fill="#e7f4ee"/>
  <circle cx="362" cy="300" r="28" fill="#e7f4ee"/>
  <ellipse cx="256" cy="330" rx="70" ry="58" fill="#e8a54b"/>
</svg>`;

for (const size of [180, 192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}

await sharp(Buffer.from(svg)).png().toFile('resources/icon.png');
await sharp(
  Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="#1a3a32"/>
  <ellipse cx="1366" cy="1366" rx="280" ry="230" fill="#e8a54b"/>
  <circle cx="1180" cy="1180" r="90" fill="#e7f4ee"/>
  <circle cx="1552" cy="1180" r="90" fill="#e7f4ee"/>
</svg>`),
)
  .png()
  .toFile('resources/splash.png');

console.log('Generated public/icons + resources/icon.png + resources/splash.png');
