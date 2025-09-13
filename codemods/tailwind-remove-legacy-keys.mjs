#!/usr/bin/env node
/**
 * Tailwind legacy color keys cleanup codemod.
 *
 * Replaces common legacy Tailwind color keys with semantic tokens:
 * - text-primary -> text
 * - bg-base -> bg-surface
 * - border-base -> border-border
 * - ring-base -> ring-border
 * - from-base/to-base -> from-surface/to-surface
 *
 * For any removed keys that had no direct semantic equivalent in code, no-op.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md']);
const replacements = [
  [/\btext-primary\b/g, 'text'],
  [/\bbg-base\b/g, 'bg-surface'],
  [/\bborder-base\b/g, 'border-border'],
  [/\bring-base\b/g, 'ring-border'],
  [/\bfrom-base\b/g, 'from-surface'],
  [/\bto-base\b/g, 'to-surface'],
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.next')) continue;
      walk(p);
    } else if (exts.has(path.extname(p))) {
      let src = fs.readFileSync(p, 'utf8');
      let changed = false;
      for (const [re, to] of replacements) {
        if (re.test(src)) {
          src = src.replaceAll(re, to);
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(p, src);
    }
  }
}

walk(ROOT);
console.log('[codemod] Tailwind legacy keys sweep complete');
