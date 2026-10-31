const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { regex: /\bborder-([a-z]+)-accent-500\b/g, replacement: 'border-$1-pv-orange' },
  { regex: /\bshadow-accent-500\b/g, replacement: 'shadow-pv-orange' },
  { regex: /\bring-accent-500\b/g, replacement: 'ring-pv-orange' },
  { regex: /\btext-brand-900\b/g, replacement: 'text-pv-bg-secondary' },
  { regex: /\btext-brand-800\b/g, replacement: 'text-pv-bg-tertiary' },
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
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

walkDir(directoryPath);
console.log('Done second pass.');
