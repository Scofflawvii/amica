#!/usr/bin/env node
/*
  Simple bundle size check using Next.js build output.
  - Parses .next/build-manifest.json to compute sizes.
  - Checks either:
    * shared (default): "First Load JS shared by all" ≈ union of chunks for pages/_app + polyfills + lowPriorityFiles
    * total: union of all client JS files across all pages
  - Fails (exit 1) if selected metric exceeds env threshold.
    Env:
      BUNDLE_CHECK_SCOPE=shared|total (default shared)
      BUNDLE_MAX_KB (default 0 → disabled)
      BUNDLE_BASELINE_KB (optional)
      BUNDLE_MAX_DELTA_KB (optional)
*/
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function fileSizeBytes(p) {
  try { return fs.statSync(p).size; } catch { return 0; }
}

function sumSizes(files) {
  return files.reduce((sum, f) => sum + fileSizeBytes(path.join(root, '.next', f)), 0);
}

// Try build-manifest.json for client file list
const buildManifest = readJson(path.join(root, '.next', 'build-manifest.json'));
if (!buildManifest) {
  console.error('[bundle-check] Missing .next/build-manifest.json. Run `npm run build` first.');
  process.exit(0); // do not fail pipeline pre-build
}

const pages = buildManifest.pages || {};
const sharedSet = new Set([...(pages['/_app'] || []), ...(buildManifest.polyfillFiles || []), ...(buildManifest.lowPriorityFiles || [])]);
const sharedFiles = Array.from(sharedSet).filter((f) => f.endsWith('.js'));
const sharedKB = kb(sumSizes(sharedFiles));

const allFiles = Array.from(new Set(Object.values(pages).flat().concat(buildManifest.polyfillFiles || [], buildManifest.lowPriorityFiles || []))).filter((f) => f.endsWith('.js'));
const totalKB = kb(sumSizes(allFiles));

const scope = (process.env.BUNDLE_CHECK_SCOPE || 'shared').toLowerCase();
const value = scope === 'total' ? totalKB : sharedKB;
const metric = scope === 'total' ? 'totalKB' : 'sharedKB';

const maxKB = Number(process.env.BUNDLE_MAX_KB || 0); // 0 disables
const baselineKB = Number(process.env.BUNDLE_BASELINE_KB || 0);
const deltaKB = Number(process.env.BUNDLE_MAX_DELTA_KB || 0);

let ok = true;
let reasons = [];
if (maxKB && value > maxKB) { ok = false; reasons.push(`${metric} ${value}kB > max ${maxKB}kB`); }
if (baselineKB && deltaKB && value - baselineKB > deltaKB) { ok = false; reasons.push(`delta ${Math.round((value - baselineKB)*10)/10}kB > max delta ${deltaKB}kB`); }

const report = { metric, sharedKB, totalKB, maxKB, baselineKB, deltaKB, scope, files: scope === 'total' ? allFiles : sharedFiles };
if (!ok) {
  console.error('[bundle-check] FAIL', JSON.stringify(report));
  process.exit(1);
}
console.log('[bundle-check] PASS', JSON.stringify(report));
