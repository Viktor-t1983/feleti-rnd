/**
 * Скрипт для генерации PNG иконок из SVG с использованием sharp
 *
 * Запуск: npx tsx scripts/generate-png-icons.ts
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Размеры иконок для PWA
const sizes = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

const publicDir = resolve(__dirname, '../public');

// Создаём директорию если не существует
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Базовая SVG иконка
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1e3a5f"/>
  <text x="256" y="200" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#3b82f6" text-anchor="middle">R&D</text>
  <circle cx="420" cy="100" r="40" fill="#3b82f6" opacity="0.8"/>
  <circle cx="90" cy="400" r="25" fill="#3b82f6" opacity="0.5"/>
</svg>`;

// Maskable SVG иконка (с safe zone)
const maskableIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1e3a5f"/>
  <g transform="translate(51, 51) scale(0.8)">
    <text x="256" y="200" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
    <text x="256" y="340" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#3b82f6" text-anchor="middle">R&D</text>
    <circle cx="420" cy="100" r="40" fill="#3b82f6" opacity="0.8"/>
    <circle cx="90" cy="400" r="25" fill="#3b82f6" opacity="0.5"/>
  </g>
</svg>`;

async function generateIcons() {
  const svgBuffer = Buffer.from(svgIcon);
  const maskableSvgBuffer = Buffer.from(maskableIcon);

  process.stdout.write('🎨 Генерация PNG иконок...\n\n');

  // Генерируем основные иконки
  for (const { name, size } of sizes) {
    const isMaskable = name.includes('maskable');
    const isApple = name.includes('apple-touch');
    const isFavicon = name.includes('favicon');

    let buffer;
    if (isMaskable) {
      buffer = await sharp(maskableSvgBuffer)
        .resize(size, size, { fit: 'contain', background: '#1e3a5f' })
        .png()
        .toBuffer();
    } else if (isApple) {
      buffer = await sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: '#1e3a5f' })
        .png()
        .toBuffer();
    } else if (isFavicon) {
      buffer = await sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: '#1e3a5f' })
        .png()
        .toBuffer();
    } else {
      buffer = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    }

    writeFileSync(resolve(publicDir, name), buffer);
    process.stdout.write(`  ✅ ${name} (${size}x${size})\n`);
  }

  // Генерируем favicon.ico (32x32 PNG может использоваться как .ico)
  const favicon32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  writeFileSync(resolve(publicDir, 'favicon.ico'), favicon32);
  process.stdout.write('  ✅ favicon.ico (32x32)\n');

  process.stdout.write('\n✨ Все иконки сгенерированы!\n');
  process.stdout.write(`📁 Директория: ${publicDir}\n`);
}

generateIcons().catch(console.error);
