#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}
function fileSizeBytes(p) {
  try { return fs.statSync(p).size; } catch { return 0; }
}
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

const manifestPath = path.join(root, '.next', 'build-manifest.json');
const buildManifest = readJson(manifestPath);
if (!buildManifest) {
  console.error('[bundle-baseline] Missing .next/build-manifest.json. Run `npm run build` first.');
  process.exit(1);
}

const pages = buildManifest.pages || {};
const sharedSet = new Set([...(pages['/_app'] || []), ...(buildManifest.polyfillFiles || []), ...(buildManifest.lowPriorityFiles || [])]);
const sharedFiles = Array.from(sharedSet).filter((f) => f.endsWith('.js'));
const allFiles = Array.from(new Set(Object.values(pages).flat().concat(buildManifest.polyfillFiles || [], buildManifest.lowPriorityFiles || []))).filter((f) => f.endsWith('.js'));

const sum = (files) => files.reduce((s, f) => s + fileSizeBytes(path.join(root, '.next', f)), 0);
const sharedKB = kb(sum(sharedFiles));
const totalKB = kb(sum(allFiles));

const outPath = path.join(root, 'bundle-baseline.json');
const payload = { sharedKB, totalKB, generatedAt: new Date().toISOString(), files: { shared: sharedFiles, total: allFiles } };
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log('[bundle-baseline] Wrote', outPath, JSON.stringify({ sharedKB, totalKB }));
