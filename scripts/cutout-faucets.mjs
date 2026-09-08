import { readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const RAW_DIR = path.resolve('public/products/raw')
const OUT_DIR = path.resolve('public/products')

// Pixels connected to the border that are near-white are treated as background.
const WHITE_HARD = 238 // >= this on every channel and low chroma -> fully background
const WHITE_SOFT = 205 // transition band for anti-aliased edges
const MAX_CHROMA = 22 // reject colored pixels from the "white" test (keeps chrome tints)

function isWhitish(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max >= WHITE_SOFT && max - min <= MAX_CHROMA
}

async function processFile(file) {
  const inputPath = path.join(RAW_DIR, file)
  const base = file.replace(/\.[^.]+$/, '')
  const outputPath = path.join(OUT_DIR, `${base}.png`)

  const { data, info } = await sharp(inputPath)
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const bg = new Uint8Array(width * height) // 1 = background
  const stack = []

  const idxAt = (x, y) => (y * width + x) * channels

  const pushIfWhite = (x, y) => {
    const p = y * width + x
    if (bg[p]) return
    const i = p * channels
    if (isWhitish(data[i], data[i + 1], data[i + 2])) {
      bg[p] = 1
      stack.push(p)
    }
  }

  for (let x = 0; x < width; x++) {
    pushIfWhite(x, 0)
    pushIfWhite(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    pushIfWhite(0, y)
    pushIfWhite(width - 1, y)
  }

  while (stack.length) {
    const p = stack.pop()
    const x = p % width
    const y = (p - x) / width
    if (x > 0) pushIfWhite(x - 1, y)
    if (x < width - 1) pushIfWhite(x + 1, y)
    if (y > 0) pushIfWhite(x, y - 1)
    if (y < height - 1) pushIfWhite(x, y + 1)
  }

  // Apply alpha: hard-white background pixels become transparent; soft band feathers.
  for (let p = 0; p < width * height; p++) {
    if (!bg[p]) continue
    const i = p * channels
    const max = Math.max(data[i], data[i + 1], data[i + 2])
    let alpha = 0
    if (max < WHITE_HARD) {
      // Anti-aliased edge: keep partial opacity so the silhouette stays smooth.
      alpha = Math.round(255 * (1 - (max - WHITE_SOFT) / (WHITE_HARD - WHITE_SOFT)))
      alpha = Math.max(0, Math.min(255, alpha))
    }
    data[i + 3] = alpha
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .trim({ threshold: 1 })
    .resize({ width: 900, height: 900, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(outputPath)

  console.log(`[cutout] ${file} -> ${path.relative(process.cwd(), outputPath)}`)
}

const files = (await readdir(RAW_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f))
for (const file of files) {
  await processFile(file)
}
console.log(`[cutout] done: ${files.length} files`)
