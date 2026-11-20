/**
 * Gera ícones PNG para o Tauri a partir da cor do tema Zenith.
 * Usa apenas Node.js padrão (zlib + buffer) — sem dependências externas.
 */
const fs = require('fs');
const zlib = require('zlib');

// ─── CRC32 ──────────────────────────────────────────────────────────────
const crcTable = [];
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─── PNG chunk helper ───────────────────────────────────────────────────
function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const chunk = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(chunk), 0);
  return Buffer.concat([lenBuf, chunk, crcBuf]);
}

// ─── PNG generator (solid color) ────────────────────────────────────────
function createPNG(width, height, color) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  const raw = Buffer.alloc(width * height * 3 + height);
  let off = 0;
  for (let y = 0; y < height; y++) {
    raw[off++] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      raw[off++] = color[0];
      raw[off++] = color[1];
      raw[off++] = color[2];
    }
  }
  const compressed = zlib.deflateSync(raw);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// ─── Zenith red (#FF2B51) ───────────────────────────────────────────────
const ZENITH_RED = [0xFF, 0x2B, 0x51];
const iconsDir = __dirname + '/icons';

// Tamanhos padrão do Tauri
const sizes = [16, 32, 128, 256, 512];
for (const s of sizes) {
  fs.writeFileSync(`${iconsDir}/${s}x${s}.png`, createPNG(s, s, ZENITH_RED));
  console.log(`✓ ${s}x${s}.png`);
}

// @2x para macOS
for (const s of [128, 256, 512]) {
  fs.writeFileSync(`${iconsDir}/${s}x${s}@2x.png`, createPNG(s, s, ZENITH_RED));
  console.log(`✓ ${s}x${s}@2x.png`);
}

console.log('\n✅ Todos os ícones foram gerados.');
