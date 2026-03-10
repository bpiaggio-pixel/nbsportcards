#!/usr/bin/env node
/**
 * apply-store-dark.mjs
 *
 * Uso:
 *   node apply-store-dark.mjs path/al/StorePageClient.tsx
 *
 * Hace reemplazos seguros (por strings exactos) para pasar tu StorePageClient a dark.
 * No toca lógica; solo clases.
 */
import fs from "fs";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node apply-store-dark.mjs <ruta-a-StorePageClient.tsx>");
  process.exit(1);
}

let s = fs.readFileSync(file, "utf8");

const reps = [
  // Root
  [
    'className="min-h-screen bg-white text-gray-900"',
    'className="min-h-screen bg-[#0b0b12] text-white"',
  ],

  // Sidebar base
  [
    'className="hidden lg:block space-y-6 rounded-2xl border border-gray-200 bg-[#fcfcfc] p-4 shadow-sm lg:p-6"',
    'className="hidden lg:block space-y-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] lg:p-6 backdrop-blur"',
  ],

  // Sidebar headers/text
  ['text-gray-500', 'text-white/55'],
  ['text-gray-800', 'text-white/85'],
  ['text-gray-700', 'text-white/70'],
  ['text-gray-600', 'text-white/60'],
  ['text-gray-400', 'text-white/40'],
  ['text-gray-900', 'text-white/90'],

  // Borders (limitado; seguro en este archivo)
  ['border border-gray-200', 'border border-white/10'],
  ['border-gray-200', 'border-white/10'],

  // White panels (limitado por patrones exactos comunes)
  ['bg-white px-3 py-2', 'bg-white/[0.04] px-3 py-2'],
  ['bg-white px-4 py-2', 'bg-white/[0.04] px-4 py-2'],
  ['bg-white p-5', 'bg-white/[0.04] p-5'],
  ['bg-white p-4', 'bg-white/[0.04] p-4'],
  ['bg-white shadow-sm', 'bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.45)]'],
  ['bg-white shadow-xl', 'bg-[#0f0f18] shadow-2xl'],

  // Image placeholders
  ['bg-[#f3f4f6]', 'bg-white/[0.03]'],

  // Hover/disabled gray backgrounds
  ['hover:bg-gray-50', 'hover:bg-white/[0.07]'],
  ['bg-gray-100', 'bg-white/[0.04]'],
  ['bg-gray-200', 'bg-white/[0.06]'],

  // CTA gradients (solo en los dos lugares típicos del archivo)
  [
    'bg-gradient-to-r from-sky-400 to-sky-600 text-white hover:from-sky-600 hover:to-sky-800 shadow-md  active:scale-[0.97]',
    'bg-gradient-to-r from-sky-500/80 to-blue-600/80 text-white hover:from-sky-400 hover:to-blue-500 shadow-[0_18px_50px_rgba(56,189,248,0.18)] active:scale-[0.97]',
  ],
  [
    'bg-gradient-to-r from-sky-400 to-sky-600 text-white hover:from-sky-600 hover:to-sky-800 shadow-md active:scale-[0.97]',
    'bg-gradient-to-r from-sky-500/80 to-blue-600/80 text-white hover:from-sky-400 hover:to-blue-500 shadow-[0_18px_50px_rgba(56,189,248,0.18)] active:scale-[0.97]',
  ],
];

for (const [a, b] of reps) {
  s = s.split(a).join(b);
}

// Pequeño ajuste: TopCardsShowcase section bg
s = s.replace('return (\n    <section className="w-full bg-white">', 'return (\n    <section className="w-full bg-transparent">');

fs.writeFileSync(file, s, "utf8");
console.log("[OK] aplicado dark a:", file);
