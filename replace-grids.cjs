const fs = require('fs');
const path = require('path');

const dir = 'src/games';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace w-64 h-64 sm:w-80 sm:h-80, w-72 h-72 sm:w-80 sm:h-80, etc.
  content = content.replace(/w-64 h-64 sm:w-80 sm:h-80/g, 'w-full max-w-[320px] aspect-square');
  content = content.replace(/w-72 h-72 sm:w-80 sm:h-80/g, 'w-full max-w-[320px] aspect-square');
  content = content.replace(/w-64 h-64 sm:w-72 sm:h-72/g, 'w-full max-w-[320px] aspect-square');
  content = content.replace(/w-80 h-80/g, 'w-full max-w-[320px] aspect-square');
  content = content.replace(/w-\[.*?\] h-\[.*?\]/g, 'w-full max-w-[320px] aspect-square');
  
  // For BlockEscape which has: relative w-72 h-72 sm:w-80 sm:h-80 bg-pv-bg-primary
  content = content.replace(/relative w-72 h-72 sm:w-80 sm:h-80/g, 'relative w-full max-w-[320px] aspect-square');
  
  fs.writeFileSync(filePath, content);
}

console.log('Game boards updated to responsive aspect-square');
