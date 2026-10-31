const fs = require('fs');
const path = require('path');

const replacements = [
  // Remove background gradients
  { regex: /\bbg-gradient-to-[a-z]+\b\s+from-[a-z]+-\d+\/?[0-9]*\s+(?:via-[a-z]+-\d+\/?[0-9]*\s+)?to-[a-z]+-\d+\/?[0-9]*/g, replacement: 'bg-pv-surface-secondary' },
  { regex: /\bbg-gradient-to-[a-z]+\b/g, replacement: '' },
  // Remove excessive glow and blur
  { regex: /\bblur-2xl\b|\bblur-3xl\b/g, replacement: '' },
  { regex: /\bshadow-pv-orange\/20\b|\bshadow-lg\b|\bshadow-xl\b|\bshadow-2xl\b/g, replacement: 'shadow-sm' },
  // Flatten card containers
  { regex: /\bbg-pv-bg-secondary\/80\b|\bbg-pv-bg-primary\/80\b|\bbg-pv-bg-primary\/60\b|\bbg-pv-bg-primary\/50\b/g, replacement: 'bg-pv-surface-primary' },
  // Soften borders
  { regex: /\bborder-white\/20\b|\bborder-pv-orange\/40\b|\bborder-pv-orange\/30\b|\bborder-pv-orange\/20\b/g, replacement: 'border-white/10' },
  // Replace generic glass with flat color
  { regex: /\bbackdrop-blur-sm\b|\bbackdrop-blur-md\b/g, replacement: '' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const { regex, replacement } of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  // Clean up any double spaces left behind
  newContent = newContent.replace(/\s{2,}/g, ' ').replace(/class(Name)?=\" /g, 'class$1=\"');
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated:', filePath);
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

walkDir(path.join(__dirname, 'src'));
console.log('Mass deflattening complete.');
