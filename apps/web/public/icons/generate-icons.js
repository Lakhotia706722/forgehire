/**
 * Icon generation script — run with: node generate-icons.js
 * Generates all required PWA icon sizes as SVG files.
 * In production, replace with proper PNG exports from your design tool.
 */
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

function makeSVG(size, maskable = false) {
  const padding = maskable ? size * 0.15 : size * 0.1;
  const iconSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = iconSize / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#080B14" rx="${maskable ? 0 : size * 0.2}"/>
  <rect width="${size}" height="${size}" fill="#00D4FF" opacity="0.08" rx="${maskable ? 0 : size * 0.2}"/>
  <!-- Hexagon -->
  <polygon
    points="${hexPoints(cx, cy, r * 0.72)}"
    fill="none"
    stroke="#00D4FF"
    stroke-width="${size * 0.04}"
    stroke-linejoin="round"
  />
  <!-- Center dot -->
  <circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="#00D4FF"/>
</svg>`;
}

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

// Regular icons
for (const size of sizes) {
  fs.writeFileSync(path.join(__dirname, `icon-${size}x${size}.svg`), makeSVG(size));
  console.log(`Generated icon-${size}x${size}.svg`);
}

// Maskable icons (safe zone = 80% of canvas)
for (const size of maskableSizes) {
  fs.writeFileSync(path.join(__dirname, `icon-maskable-${size}x${size}.svg`), makeSVG(size, true));
  console.log(`Generated icon-maskable-${size}x${size}.svg`);
}

// Badge icon
fs.writeFileSync(path.join(__dirname, 'badge-72x72.svg'), makeSVG(72));
console.log('Generated badge-72x72.svg');

console.log('Done. Replace .svg with .png exports for production.');
