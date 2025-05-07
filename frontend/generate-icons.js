// Create a script to generate the required icons:
// Save this to scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Ensure the icons directory exists
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon as a placeholder
const createSvgIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0ea5e9" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="${size/4}" fill="white">TM</text>
</svg>`;
};

// Generate all required icon sizes
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
iconSizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  // For simplicity, we'll create SVG icons instead of PNG
  // In a real project, you'd want to generate proper PNG files
  fs.writeFileSync(iconPath.replace('.png', '.svg'), createSvgIcon(size));
  console.log(`Created icon: ${iconPath.replace('.png', '.svg')}`);
});

// Create maskable icon
fs.writeFileSync(
  path.join(iconsDir, 'maskable-icon.svg'),
  createSvgIcon(192)
);
console.log('Created maskable icon');