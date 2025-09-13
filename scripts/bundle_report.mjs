#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const manifestPath = path.join(root, '.next', 'build-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('[bundle-report] Missing .next/build-manifest.json. Run `npm run build` first.');
  process.exit(1);
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const stat = (p) => { try { return fs.statSync(p).size; } catch { return 0; } };
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

const manifest = readJson(manifestPath);
const pages = manifest.pages || {};
const poly = manifest.polyfillFiles || [];
const low = manifest.lowPriorityFiles || [];

const allClientFiles = Array.from(new Set(Object.values(pages).flat().concat(poly, low)))
  .filter((f) => f.endsWith('.js'));

const sizeMap = new Map();
for (const f of allClientFiles) {
  const abs = path.join(root, '.next', f);
  sizeMap.set(f, kb(stat(abs)));
}

const sharedSet = new Set([...(pages['/_app'] || []), ...poly, ...low]);
const sharedFiles = Array.from(sharedSet).filter((f) => f.endsWith('.js'));
const sharedKB = sharedFiles.reduce((s, f) => s + (sizeMap.get(f) || 0), 0);
const totalKB = allClientFiles.reduce((s, f) => s + (sizeMap.get(f) || 0), 0);

// Per-page first load approximation: union of page files + shared set
const pageEntries = Object.entries(pages)
  .filter(([route]) => route !== '/_app')
  .map(([route, files]) => {
    const set = new Set([...(files || []), ...sharedFiles]);
    const js = Array.from(set).filter((f) => f.endsWith('.js'));
    const size = js.reduce((s, f) => s + (sizeMap.get(f) || 0), 0);
    return { route, size: Math.round(size * 10) / 10, files: js };
  })
  .sort((a, b) => b.size - a.size);

// Top files by size
const topN = Number(process.env.BUNDLE_REPORT_TOP || 20);
const topFiles = Array.from(sizeMap.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, topN)
  .map(([file, size]) => ({ file, size }));

let baseline = null;
const baselineFile = process.env.BUNDLE_BASELINE_FILE || 'bundle-baseline.json';
if (fs.existsSync(path.join(root, baselineFile))) {
  try { baseline = readJson(path.join(root, baselineFile)); } catch {}
}

const md = [];
md.push('<!-- BUNDLE_REPORT_MARKER:amica -->');
md.push('## 📦 Bundle Size Report');
md.push('');
md.push(`- Shared (first-load) JS: ${sharedKB} kB`);
md.push(`- Total client JS: ${totalKB} kB`);
if (baseline) {
  md.push(`- Baseline shared: ${baseline.sharedKB} kB  ·  Δ: ${Math.round((sharedKB - baseline.sharedKB) * 10) / 10} kB`);
  md.push(`- Baseline total: ${baseline.totalKB} kB  ·  Δ: ${Math.round((totalKB - baseline.totalKB) * 10) / 10} kB`);
}
md.push('');
md.push('### Top client JS files');
md.push('');
md.push('| Size (kB) | File |');
md.push('|---:|:---|');
for (const { file, size } of topFiles) md.push(`| ${size} | ${file} |`);
md.push('');
md.push('### Heaviest pages (approx. first load)');
md.push('');
md.push('| Size (kB) | Route |');
md.push('|---:|:---|');
for (const { route, size } of pageEntries.slice(0, topN)) md.push(`| ${size} | ${route} |`);
md.push('');

const output = md.join('\n');
console.log(output);

// Also write to step summary if available
if (process.env.GITHUB_STEP_SUMMARY) {
  try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n' + output + '\n'); } catch {}
}
