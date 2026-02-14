// 파비콘 생성 스크립트
// SVG를 다양한 크기의 PNG로 변환

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG 파비콘 템플릿
const createFaviconSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#FFE5E5" rx="${size * 0.16}"/>
  <g transform="translate(${size * 0.25}, ${size * 0.2})">
    <path d="M0 ${size * 0.226}A${size * 0.083} ${size * 0.083} 0 0 1 ${size * 0.029} ${size * 0.063}a${size * 0.106} ${size * 0.106} 0 0 1 ${size * 0.022}-${size * 0.032} ${size * 0.104} ${size * 0.104} 0 0 1 ${size * 0.147} 0A${size * 0.106} ${size * 0.106} 0 0 1 ${size * 0.22} ${size * 0.063} ${size * 0.083} ${size * 0.083} 0 0 1 ${size * 0.25} ${size * 0.226}V${size * 0.375}H0Z" fill="#FF6B6B"/>
    <rect x="0" y="${size * 0.292}" width="${size * 0.25}" height="${size * 0.083}" fill="#FF8787"/>
  </g>
</svg>`;

// 다양한 크기의 SVG 파비콘 생성
const sizes = [
  { name: 'favicon-16x16.svg', size: 16 },
  { name: 'favicon-32x32.svg', size: 32 },
  { name: 'favicon-48x48.svg', size: 48 },
  { name: 'apple-touch-icon.svg', size: 180 }
];

const publicDir = path.join(__dirname, '../public');

// 각 크기별 SVG 생성
sizes.forEach(({ name, size }) => {
  const svg = createFaviconSVG(size);
  const filePath = path.join(publicDir, name);
  fs.writeFileSync(filePath, svg);
  console.log(`✅ 생성 완료: ${name} (${size}x${size})`);
});

console.log('\n📝 PNG 변환 안내:');
console.log('SVG 파일을 PNG로 변환하려면 다음 도구를 사용하세요:');
console.log('1. https://cloudconvert.com/svg-to-png (온라인)');
console.log('2. Inkscape, GIMP 등의 그래픽 도구');
console.log('3. 또는 SVG 파일을 그대로 사용 (최신 브라우저 지원)\n');
