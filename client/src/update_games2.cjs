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
  if (!content.includes('difficulty: state.difficulty')) {
    // Some might not have isDailyPuzzle, so we match on currentXp
    content = content.replace(
      /currentXp:\s*([^,}]+)/g,
      `currentXp: $1,
            difficulty: state.difficulty,
            stage: typeof state.currentQuestionIndex !== 'undefined' ? state.currentQuestionIndex + 1 : undefined`
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
