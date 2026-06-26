const fs = require('fs');
const path = require('path');

function createPNG(size) {
  const padding = Math.floor(size * 0.12);
  const r = Math.floor(size * 0.18);
  const center = size / 2;

  const pixels = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const cornerRadius = r;

      let insideCorner = true;
      if (x < cornerRadius && y < cornerRadius) {
        const dx = cornerRadius - x;
        const dy = cornerRadius - y;
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) insideCorner = false;
      }
      if (x > size - cornerRadius && y < cornerRadius) {
        const dx = x - (size - cornerRadius);
        const dy = cornerRadius - y;
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) insideCorner = false;
      }
      if (x < cornerRadius && y > size - cornerRadius) {
        const dx = cornerRadius - x;
        const dy = y - (size - cornerRadius);
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) insideCorner = false;
      }
      if (x > size - cornerRadius && y > size - cornerRadius) {
        const dx = x - (size - cornerRadius);
        const dy = y - (size - cornerRadius);
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) insideCorner = false;
      }

      if (!insideCorner) {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
        continue;
      }

      const t = y / size;
      const r1 = Math.round(59 + (29 - 59) * t);
      const g1 = Math.round(130 + (78 - 130) * t);
      const b1 = Math.round(246 + (216 - 246) * t);

      const isRupeeSymbol = (
        y > size * 0.25 && y < size * 0.5 &&
        Math.abs(x - center) < size * 0.15
      );
      const isProfitText = (
        y > size * 0.58 && y < size * 0.72 &&
        Math.abs(x - center) < size * 0.28
      );
      const isManagerText = (
        y > size * 0.75 && y < size * 0.85 &&
        Math.abs(x - center) < size * 0.2
      );

      if (isRupeeSymbol || isProfitText || isManagerText) {
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      } else {
        pixels[idx] = r1;
        pixels[idx + 1] = g1;
        pixels[idx + 2] = b1;
        pixels[idx + 3] = 255;
      }
    }
  }

  return encodePNG(size, size, pixels);
}

function encodePNG(width, height, pixels) {
  function crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function adler32(data) {
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  function writeUint32BE(buf, val, offset) {
    buf[offset] = (val >>> 24) & 0xFF;
    buf[offset + 1] = (val >>> 16) & 0xFF;
    buf[offset + 2] = (val >>> 8) & 0xFF;
    buf[offset + 3] = val & 0xFF;
  }

  function writeUint16BE(buf, val, offset) {
    buf[offset] = (val >>> 8) & 0xFF;
    buf[offset + 1] = val & 0xFF;
  }

  const rawRowSize = 1 + width * 4;
  const rawData = new Uint8Array(rawRowSize * height);
  for (let y = 0; y < height; y++) {
    rawData[y * rawRowSize] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * rawRowSize + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  let compressed;
  try {
    const zlib = require('zlib');
    compressed = zlib.deflateSync(rawData);
  } catch (e) {
    compressed = rawData;
  }

  const ihdrData = new Uint8Array(13);
  writeUint32BE(ihdrData, width, 0);
  writeUint32BE(ihdrData, height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrCrcData = new Uint8Array(4 + 13);
  ihdrCrcData.set([0x49, 0x48, 0x44, 0x52]);
  ihdrCrcData.set(ihdrData, 4);
  const ihdrCrc = crc32(ihdrCrcData);

  const idatCrcData = new Uint8Array(4 + compressed.length);
  idatCrcData.set([0x49, 0x44, 0x41, 0x54]);
  idatCrcData.set(compressed, 4);
  const idatCrc = crc32(idatCrcData);

  const pngSize = 8 + 12 + 13 + 12 + compressed.length + 12;
  const png = new Uint8Array(pngSize);
  let offset = 0;

  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  png.set(signature, offset);
  offset += 8;

  writeUint32BE(png, 13, offset);
  offset += 4;
  png.set([0x49, 0x48, 0x44, 0x52], offset);
  offset += 4;
  png.set(ihdrData, offset);
  offset += 13;
  writeUint32BE(png, ihdrCrc, offset);
  offset += 4;

  writeUint32BE(png, compressed.length, offset);
  offset += 4;
  png.set([0x49, 0x44, 0x41, 0x54], offset);
  offset += 4;
  png.set(compressed, offset);
  offset += compressed.length;
  writeUint32BE(png, idatCrc, offset);
  offset += 4;

  writeUint32BE(png, 0, offset);
  offset += 4;
  png.set([0x49, 0x45, 0x4E, 0x44], offset);
  offset += 4;
  writeUint32BE(png, crc32(new Uint8Array([0x49, 0x45, 0x4E, 0x44])), offset);

  return png;
}

const iconsDir = path.join(__dirname, 'client', 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  const png = createPNG(size);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created: icon-${size}x${size}.png`);
});

console.log('All icons generated!');
