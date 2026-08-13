import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });
mkdirSync('resources', { recursive: true });

/** Full-bleed dog face — iOS rounds the square itself. */
const dog = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1a3a32"/>
  <!-- floppy ears -->
  <ellipse cx="128" cy="210" rx="78" ry="128" fill="#c4783a" transform="rotate(-22 128 210)"/>
  <ellipse cx="384" cy="210" rx="78" ry="128" fill="#c4783a" transform="rotate(22 384 210)"/>
  <ellipse cx="138" cy="218" rx="34" ry="78" fill="#f3c4a3" transform="rotate(-22 138 218)"/>
  <ellipse cx="374" cy="218" rx="34" ry="78" fill="#f3c4a3" transform="rotate(22 374 218)"/>
  <!-- head -->
  <circle cx="256" cy="286" r="168" fill="#f6e2c4"/>
  <!-- cheeks -->
  <ellipse cx="150" cy="318" rx="44" ry="32" fill="#f0b49a" opacity="0.85"/>
  <ellipse cx="362" cy="318" rx="44" ry="32" fill="#f0b49a" opacity="0.85"/>
  <!-- eyes -->
  <ellipse cx="196" cy="262" rx="28" ry="36" fill="#143029"/>
  <ellipse cx="316" cy="262" rx="28" ry="36" fill="#143029"/>
  <circle cx="206" cy="250" r="10" fill="#ffffff"/>
  <circle cx="326" cy="250" r="10" fill="#ffffff"/>
  <!-- snout -->
  <ellipse cx="256" cy="348" rx="86" ry="62" fill="#fff8ee"/>
  <!-- nose -->
  <ellipse cx="256" cy="328" rx="34" ry="24" fill="#143029"/>
  <ellipse cx="244" cy="320" rx="8" ry="6" fill="#e7f4ee" opacity="0.55"/>
  <!-- smile + tongue -->
  <path d="M214 362 Q256 400 298 362" fill="none" stroke="#143029" stroke-width="12" stroke-linecap="round"/>
  <ellipse cx="256" cy="392" rx="20" ry="18" fill="#c45c4a"/>
</svg>`;

const favicon = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1a3a32"/>
  <circle cx="22" cy="22" r="7" fill="#f6e2c4"/>
  <circle cx="42" cy="22" r="7" fill="#f6e2c4"/>
  <circle cx="14" cy="36" r="6" fill="#f6e2c4"/>
  <circle cx="50" cy="36" r="6" fill="#f6e2c4"/>
  <ellipse cx="32" cy="42" rx="13" ry="11" fill="#e8a54b"/>
</svg>`;

for (const size of [180, 192, 512]) {
  await sharp(Buffer.from(dog)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}

await sharp(Buffer.from(dog)).png().toFile('resources/icon.png');
await sharp(
  Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="#1a3a32"/>
  <circle cx="1366" cy="1500" r="520" fill="#f6e2c4"/>
  <ellipse cx="900" cy="1280" rx="220" ry="360" fill="#c4783a" transform="rotate(-20 900 1280)"/>
  <ellipse cx="1832" cy="1280" rx="220" ry="360" fill="#c4783a" transform="rotate(20 1832 1280)"/>
  <ellipse cx="1180" cy="1420" rx="70" ry="90" fill="#143029"/>
  <ellipse cx="1552" cy="1420" rx="70" ry="90" fill="#143029"/>
  <ellipse cx="1366" cy="1680" rx="160" ry="90" fill="#fff8ee"/>
  <ellipse cx="1366" cy="1620" rx="70" ry="48" fill="#143029"/>
</svg>`),
)
  .png()
  .toFile('resources/splash.png');

const { writeFileSync } = await import('fs');
writeFileSync('public/favicon.svg', favicon.trim());

console.log('Generated dog-face icons + paw favicon');
