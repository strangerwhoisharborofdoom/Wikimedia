const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with per-scanline filter byte 0
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.42;
  const rInner = width * 0.38;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: dark stone (#1c1917 -> rgb(28, 25, 23))
      let r = 28;
      let g = 25;
      let b = 23;
      let a = 255;

      // Outer border circle or rounded card
      if (dist < rOuter && dist >= rInner) {
        // Gold amber ring (#f59e0b -> rgb(245, 158, 11))
        r = 245;
        g = 158;
        b = 11;
      } else if (dist < rInner) {
        // Inner lens fill: deep dark slate
        r = 38;
        g = 35;
        b = 32;
        // Draw stylized 'W' in center
        const nx = (x - cx) / (width * 0.25);
        const ny = (y - cy) / (height * 0.25);
        // Stylized W bounds: nx in [-1, 1], ny in [-0.7, 0.7]
        if (Math.abs(nx) <= 0.8 && ny >= -0.6 && ny <= 0.6) {
          // Simple geometric W stroke detection
          const leg1 = Math.abs(ny - (2 * (nx + 0.5) - 0.4));
          const leg2 = Math.abs(ny + (2 * (nx + 0.1) - 0.4));
          const leg3 = Math.abs(ny - (2 * (nx - 0.1) - 0.4));
          const leg4 = Math.abs(ny + (2 * (nx - 0.5) - 0.4));
          const minLeg = Math.min(leg1, leg2, leg3, leg4);
          if (minLeg < 0.22) {
            // White / cream letter text (#fafaf9)
            r = 250;
            g = 250;
            b = 249;
          }
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));
console.log('Successfully generated all PWA PNG icon assets!');
