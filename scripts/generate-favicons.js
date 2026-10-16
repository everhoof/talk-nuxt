/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { Resvg } = require('@resvg/resvg-js');
const digits = require('../assets/favicon/digits.json');

const source = fs.readFileSync(path.join(__dirname, '../assets/favicon/base.svg'), 'utf8');
const output = path.join(__dirname, '../static');
const preview = path.join(__dirname, '../.nuxt/favicons');
const version = createHash('sha256')
  .update(source)
  .update(JSON.stringify(digits))
  .update(fs.readFileSync(__filename))
  .digest('hex')
  .slice(0, 12);
const badge = {
  radius: 184,
  strokeWidth: 26,
  outline: '#0d0b53',
  unread: '#d92d42',
  text: '#ffffff',
  chat: '#f5f4fc',
  dots: '#706bbc',
};

function createSvg(count) {
  const [, bounds] = source.match(/viewBox="([^"]+)"/);
  const [x, y, width, height] = bounds.split(/\s+/).map(Number);
  const cx = x + width - badge.radius - badge.strokeWidth / 2;
  const cy = y + height - badge.radius - badge.strokeWidth / 2;
  const circle = `<circle cx="${cx}" cy="${cy}" r="${badge.radius}" fill="${
    count ? badge.unread : badge.chat
  }" stroke="${badge.outline}" stroke-width="${badge.strokeWidth}" />`;
  // Glyphs are centered paths drawn on a circle with radius 153; no installed font is needed.
  const content = count
    ? count <= 9
      ? `<path d="${digits[count]}" fill="${badge.text}" />`
      : ''
    : [-56, 0, 56].map((dx) => `<circle cx="${dx}" cy="0" r="18" fill="${badge.dots}" />`).join('');
  const symbol = `<g transform="translate(${cx} ${cy}) scale(${badge.radius / 153})">${content}</g>`;
  return source.replace('</svg>', `${circle}\n${symbol}\n</svg>`);
}

function render(svg, size) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  })
    .render()
    .asPng();
}

function createIco(svg) {
  const sizes = [16, 32, 48, 64];
  const images = sizes.map((size) => render(svg, size));
  // ICO directory followed by PNG frames, one for each tab/display size.
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((png, index) => {
    const entry = 6 + 16 * index;
    header[entry] = sizes[index];
    header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images]);
}

fs.mkdirSync(path.join(output, 'favicons'), { recursive: true });
if (process.argv.includes('--svg')) fs.mkdirSync(preview, { recursive: true });

for (let count = 0; count <= 10; count++) {
  const name = count ? `favicons/unread-${count > 9 ? 'dot' : count}` : 'favicon';
  const svg = createSvg(count);
  fs.writeFileSync(path.join(output, `${name}.png`), render(svg, 64));
  if (count === 0) fs.writeFileSync(path.join(output, 'favicon.ico'), createIco(svg));
  if (process.argv.includes('--svg')) {
    fs.writeFileSync(path.join(preview, `${path.basename(name)}.svg`), svg);
  }
}

fs.writeFileSync(path.join(output, 'favicons/version.json'), `${JSON.stringify({ version }, null, 2)}\n`);

console.log('Generated 11 PNG favicons and the default ICO fallback.');
