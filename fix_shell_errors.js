const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'frontend', 'src');

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) walkSync(filepath, callback);
    else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) callback(filepath);
  });
}

walkSync(SRC_DIR, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  const replacePatterns = [
    {
      from: /getCurrentUser\(\)\.then\(setCurrentUser\);/g,
      to: 'const u = getCurrentUser(); if (u) setCurrentUser(u);'
    },
    {
      from: /getCurrentUser\(\)\.then\(setCurrentUserState\);/g,
      to: 'const u = getCurrentUser(); if (u) setCurrentUserState(u);'
    },
    {
      from: /getCurrentUser\(\)\.then\(\(newUser\) => {/g,
      to: 'const newUser = getCurrentUser(); if (newUser) {'
    }
  ];

  for (const { from, to } of replacePatterns) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Fixed', filepath);
  }
});
