import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  // Primary brand replacements
  { regex: /\bpv-orange-deep\b/g, replacement: 'pv-dragon-fruit-deep' },
  { regex: /\bpv-orange-light\b/g, replacement: 'pv-dragon-fruit-light' },
  { regex: /\bpv-orange-secondary\b/g, replacement: 'pv-dragon-fruit-soft' },
  { regex: /\bpv-orange\b/g, replacement: 'pv-dragon-fruit' },
  
  // Tailwind default colors used for old branding (yellow/orange/gold)
  { regex: /\btext-orange-400\b/g, replacement: 'text-pv-dragon-fruit' },
  { regex: /\btext-orange-500\b/g, replacement: 'text-pv-dragon-fruit' },
  { regex: /\btext-amber-300\b/g, replacement: 'text-pv-dragon-fruit-light' },
  { regex: /\btext-amber-400\b/g, replacement: 'text-pv-dragon-fruit' },
  { regex: /\bfill-amber-400\b/g, replacement: 'fill-pv-dragon-fruit' },
  { regex: /\bfill-orange-400\b/g, replacement: 'fill-pv-dragon-fruit' },
  { regex: /\bbg-amber-400\b/g, replacement: 'bg-pv-dragon-fruit' },
  { regex: /\bborder-amber-400\b/g, replacement: 'border-pv-dragon-fruit' },
  { regex: /\btext-yellow-400\b/g, replacement: 'text-pv-dragon-fruit' },
  { regex: /\btext-yellow-500\b/g, replacement: 'text-pv-dragon-fruit' },
  { regex: /\bbg-yellow-400\b/g, replacement: 'bg-pv-dragon-fruit' },
  { regex: /\bbg-yellow-500\b/g, replacement: 'bg-pv-dragon-fruit' },
  { regex: /\bborder-yellow-500\b/g, replacement: 'border-pv-dragon-fruit' },
  
  // Purple/Indigo replacements (since new theme is Night Violet)
  { regex: /\btext-indigo-400\b/g, replacement: 'text-pv-dragon-fruit-light' },
  { regex: /\bbg-indigo-500\/20\b/g, replacement: 'bg-pv-surface-soft' },
  { regex: /\bbg-indigo-500\/10\b/g, replacement: 'bg-pv-surface-soft' },
  { regex: /\bborder-indigo-500\/30\b/g, replacement: 'border-pv-border-violet' },
  { regex: /\bborder-indigo-500\/40\b/g, replacement: 'border-pv-border-strong' },
  { regex: /\btext-indigo-300\b/g, replacement: 'text-pv-dragon-fruit-light' },
  { regex: /\btext-purple-400\b/g, replacement: 'text-pv-dragon-fruit-light' },
  { regex: /\btext-purple-500\b/g, replacement: 'text-pv-dragon-fruit' },
  { regex: /\bbg-purple-500\b/g, replacement: 'bg-pv-dragon-fruit' },
  { regex: /\bbg-purple-500\/20\b/g, replacement: 'bg-pv-surface-soft' },
  { regex: /\bbg-indigo-600\b/g, replacement: 'bg-pv-dragon-fruit' },
  
  // Replace old border colors
  { regex: /\bborder-white\/5\/80\b/g, replacement: 'border-pv-border-violet' },
  { regex: /\bborder-white\/5\b/g, replacement: 'border-pv-border-violet' },
  { regex: /\bborder-white\/10\b/g, replacement: 'border-pv-border-strong' },

  // Background and surface classes
  { regex: /\bbg-slate-900\b/g, replacement: 'bg-pv-bg-secondary' },
  { regex: /\bbg-slate-800\b/g, replacement: 'bg-pv-bg-tertiary' },
  { regex: /\bbg-slate-700\b/g, replacement: 'bg-pv-surface-soft' },
  { regex: /\bborder-slate-800\b/g, replacement: 'border-pv-border-violet' },
  { regex: /\bborder-slate-700\b/g, replacement: 'border-pv-border-strong' },
  { regex: /\bborder-slate-900\b/g, replacement: 'border-pv-border-strong' },
  { regex: /\btext-slate-400\b/g, replacement: 'text-pv-text-muted' },
  { regex: /\btext-slate-600\b/g, replacement: 'text-pv-text-disabled' },
  
  // Custom previous variables
  { regex: /\bpv-blue\b/g, replacement: 'pv-dragon-fruit' },
  { regex: /\bpv-purple\b/g, replacement: 'pv-dragon-fruit' },
  { regex: /\bpv-purple-secondary\b/g, replacement: 'pv-surface-soft' },
  { regex: /\bpv-teal\b/g, replacement: 'pv-dragon-fruit-soft' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const { regex, replacement } of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
      processFile(filePath);
    }
  }
}

walkDir(directoryPath);
console.log('Migration completed.');
