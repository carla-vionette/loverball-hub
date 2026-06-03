#!/usr/bin/env node
/**
 * Image optimization script for Loverball.
 *
 * Walks src/assets/, public/lovable-uploads/, public/images/, public/event-images/
 * and for every PNG/JPG/JPEG over 100 KB:
 *   - Resizes so max dimension is 1600px (preserves aspect ratio)
 *   - Generates .avif (q60) and .webp (q75) siblings
 *   - Re-encodes the original JPEG at q80 if it's larger than necessary
 *
 * Originals are kept so existing imports continue to work. Components can
 * opt into the new formats via the <ResponsiveImage /> wrapper.
 *
 * Usage:  node scripts/optimize-images.mjs [--dry-run]
 */

import { readdir, stat, mkdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOTS = [
  "src/assets",
  "public/lovable-uploads",
  "public/images",
  "public/event-images",
];

const MAX_DIMENSION = 1600;
const SIZE_FLOOR_BYTES = 100 * 1024; // skip files under 100 KB
const AVIF_QUALITY = 60;
const WEBP_QUALITY = 75;
const JPEG_REENCODE_QUALITY = 80;

const DRY_RUN = globalThis.process.argv.includes("--dry-run");
const CWD = globalThis.process.cwd();

/** @returns {Promise<string[]>} */
async function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (/\.(png|jpg|jpeg)$/i.test(ent.name)) {
      out.push(full);
    }
  }
  return out;
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function processImage(filePath) {
  const st = await stat(filePath);
  if (st.size < SIZE_FLOOR_BYTES) return null;

  const base = filePath.replace(/\.(png|jpg|jpeg)$/i, "");
  const avifOut = `${base}.avif`;
  const webpOut = `${base}.webp`;

  const image = sharp(filePath, { failOn: "none" });
  const meta = await image.metadata();

  // Resize spec: keep aspect ratio, max edge = MAX_DIMENSION
  const needsResize =
    (meta.width && meta.width > MAX_DIMENSION) ||
    (meta.height && meta.height > MAX_DIMENSION);

  const pipeline = needsResize
    ? image.clone().resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
    : image.clone();

  const result = {
    file: path.relative(CWD, filePath),
    original: st.size,
    width: meta.width,
    height: meta.height,
    avif: 0,
    webp: 0,
    reencoded: 0,
  };

  if (DRY_RUN) {
    return result;
  }

  // AVIF
  if (!existsSync(avifOut)) {
    await pipeline.clone().avif({ quality: AVIF_QUALITY, effort: 4 }).toFile(avifOut);
    result.avif = statSync(avifOut).size;
  } else {
    result.avif = statSync(avifOut).size;
  }

  // WebP
  if (!existsSync(webpOut)) {
    await pipeline.clone().webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webpOut);
    result.webp = statSync(webpOut).size;
  } else {
    result.webp = statSync(webpOut).size;
  }

  // Re-encode original JPEG if it's significantly larger than 1600px or quality > 80
  if (/\.jpe?g$/i.test(filePath) && needsResize) {
    const tmpOut = `${filePath}.tmp`;
    await pipeline
      .clone()
      .jpeg({ quality: JPEG_REENCODE_QUALITY, progressive: true, mozjpeg: true })
      .toFile(tmpOut);
    const tmpSize = statSync(tmpOut).size;
    if (tmpSize < st.size) {
      const fs = await import("node:fs/promises");
      await fs.rename(tmpOut, filePath);
      result.reencoded = tmpSize;
    } else {
      const fs = await import("node:fs/promises");
      await fs.unlink(tmpOut);
    }
  }

  return result;
}

async function main() {
  const allFiles = [];
  for (const root of ROOTS) {
    allFiles.push(...(await walk(root)));
  }

  console.log(`Scanning ${allFiles.length} raster images across ${ROOTS.length} directories...`);
  if (DRY_RUN) console.log("(dry run — no files will be written)");

  let processed = 0;
  let skippedSmall = 0;
  let totalOriginal = 0;
  let totalAvif = 0;
  let totalWebp = 0;
  let totalReencoded = 0;
  const reductions = [];

  for (const f of allFiles) {
    try {
      const r = await processImage(f);
      if (!r) {
        skippedSmall++;
        continue;
      }
      processed++;
      totalOriginal += r.original;
      totalAvif += r.avif;
      totalWebp += r.webp;
      if (r.reencoded) totalReencoded += r.reencoded;

      if (processed <= 30 || processed % 10 === 0) {
        const ratio = r.avif
          ? `→ AVIF ${fmtKB(r.avif)} (${Math.round((1 - r.avif / r.original) * 100)}% smaller)`
          : "";
        console.log(`  ${r.file}  ${fmtKB(r.original)}  ${ratio}`);
      }

      reductions.push({ file: r.file, original: r.original, avif: r.avif, webp: r.webp });
    } catch (err) {
      console.error(`  ✗ failed: ${path.relative(CWD, f)} — ${err.message}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total raster images scanned:    ${allFiles.length}`);
  console.log(`Skipped (under 100 KB):         ${skippedSmall}`);
  console.log(`Processed:                      ${processed}`);
  console.log(`Total original size:            ${fmtKB(totalOriginal)} (${(totalOriginal / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`Total AVIF generated:           ${fmtKB(totalAvif)} (${(totalAvif / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`Total WebP generated:           ${fmtKB(totalWebp)} (${(totalWebp / 1024 / 1024).toFixed(1)} MB)`);
  if (totalReencoded) {
    console.log(`JPEG re-encoded:                ${fmtKB(totalReencoded)} (${(totalReencoded / 1024 / 1024).toFixed(1)} MB)`);
  }
  console.log(`\nAVIF savings vs original:       ${Math.round((1 - totalAvif / totalOriginal) * 100)}%`);
  console.log(`WebP savings vs original:       ${Math.round((1 - totalWebp / totalOriginal) * 100)}%`);
}

main().catch((err) => {
  console.error(err);
  globalThis.process.exit(1);
});
