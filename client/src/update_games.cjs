const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));
  });
  return filelist;
}

const files = walkSync('c:/Users/jnsid/OneDrive/Documents/Puzzle/client/src/games').filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('isDailyPuzzle:') && !content.includes('difficulty: state.difficulty')) {
    // We look for setResultData({ ... }) block
    content = content.replace(
      /isDailyPuzzle:\s*state\.isDailyPuzzle,?\s*/g,
      `difficulty: state.difficulty,
            stage: typeof state.currentQuestionIndex !== 'undefined' ? state.currentQuestionIndex + 1 : undefined,
            isDailyPuzzle: state.isDailyPuzzle,
            `
    );
    // Cleanup any trailing commas before }
    content = content.replace(/,\s*\n\s*}/g, '\n          }');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
