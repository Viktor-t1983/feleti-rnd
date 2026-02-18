/**
 * Скрипт для генерации иконок PWA
 *
 * Для генерации PNG иконок используйте один из способов:
 *
 * 1. Онлайн генератор (рекомендуется):
 *    - https://pwa-image-generator.vercel.app/
 *    - Загрузите SVG из public/masked-icon.svg
 *    - Скачайте все размеры
 *
 * 2. Используя sharp (Node.js):
 *    npm install -D sharp
 *    npx tsx scripts/generate-icons.ts
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SVG иконка FELETI R&D
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1e3a5f"/>
  <text x="256" y="200" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#3b82f6" text-anchor="middle">R&D</text>
  <circle cx="420" cy="100" r="40" fill="#3b82f6" opacity="0.8"/>
  <circle cx="90" cy="400" r="25" fill="#3b82f6" opacity="0.5"/>
</svg>`;

// Maskable иконка (с safe zone для Android)
const maskableIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1e3a5f"/>
  <!-- Safe zone content (centered with padding) -->
  <g transform="translate(51, 51) scale(0.8)">
    <text x="256" y="200" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
    <text x="256" y="340" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#3b82f6" text-anchor="middle">R&D</text>
    <circle cx="420" cy="100" r="40" fill="#3b82f6" opacity="0.8"/>
    <circle cx="90" cy="400" r="25" fill="#3b82f6" opacity="0.5"/>
  </g>
</svg>`;

// Apple touch icon (180x180 с отступами)
const appleTouchIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#1e3a5f"/>
  <text x="90" y="70" font-family="Arial Black, sans-serif" font-size="42" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
  <text x="90" y="120" font-family="Arial, sans-serif" font-size="21" font-weight="bold" fill="#3b82f6" text-anchor="middle">R&D</text>
</svg>`;

// Favicon SVG (для современных браузеров)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#1e3a5f"/>
  <text x="16" y="14" font-family="Arial Black, sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
  <text x="16" y="24" font-family="Arial, sans-serif" font-size="6" font-weight="bold" fill="#3b82f6" text-anchor="middle">R&D</text>
</svg>`;

const publicDir = resolve(__dirname, '../public');

// Создаём директорию если не существует
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Сохраняем SVG файлы
writeFileSync(resolve(publicDir, 'masked-icon.svg'), svgIcon);
writeFileSync(resolve(publicDir, 'maskable-icon.svg'), maskableIcon);
writeFileSync(resolve(publicDir, 'apple-touch-icon.svg'), appleTouchIcon);
writeFileSync(resolve(publicDir, 'favicon.svg'), faviconSvg);

process.stdout.write('✅ SVG иконки созданы:\n');
process.stdout.write('   - public/masked-icon.svg\n');
process.stdout.write('   - public/maskable-icon.svg\n');
process.stdout.write('   - public/apple-touch-icon.svg\n');
process.stdout.write('   - public/favicon.svg\n');
process.stdout.write('\n');
process.stdout.write('⚠️  PNG иконки нужно создать вручную:\n');
process.stdout.write('\n');
process.stdout.write('📋 Инструкция:\n');
process.stdout.write('1. Откройте https://pwa-image-generator.vercel.app/\n');
process.stdout.write('2. Загрузите файл: public/masked-icon.svg\n');
process.stdout.write('3. Скачайте архив с иконками\n');
process.stdout.write('4. Распакуйте в public/:\n');
process.stdout.write('   - pwa-64x64.png\n');
process.stdout.write('   - pwa-192x192.png\n');
process.stdout.write('   - pwa-512x512.png\n');
process.stdout.write('   - maskable-icon-512x512.png\n');
process.stdout.write('   - apple-touch-icon.png\n');
process.stdout.write('   - favicon.ico\n');
process.stdout.write('\n');
process.stdout.write('Или используйте maskable.app для maskable иконок:\n');
process.stdout.write('https://maskable.app/\n');
