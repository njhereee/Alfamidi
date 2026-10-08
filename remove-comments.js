const fs = require('fs');
const path = require('path');

const targetDirs = [
  'src/frontend/dashboard',
  'src/app'
];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function removeComments(content) {
  // 1. Remove JSX comments: {/* ... */}
  // We use [\s\S]*? to make it non-greedy across newlines
  let result = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  
  // 2. Remove multi-line comments: /* ... */
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 3. Remove single-line comments: // ...
  // Be careful not to remove // inside strings or URLs (like http://)
  // This is a naive regex, it might fail on string literals containing '//'
  // But a safer one: match // only if it's not preceded by : or " or '
  result = result.replace(/(?<![:"'])\s*\/\/.*$/gm, '');
  
  // Clean up excessive empty lines left by comment removal
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return result;
}

targetDirs.forEach(dir => {
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const newContent = removeComments(content);
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Removed comments in ${filePath}`);
      }
    }
  });
});
