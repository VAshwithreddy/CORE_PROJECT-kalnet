const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "frontend", "src");

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && (filepath.endsWith(".ts") || filepath.endsWith(".tsx"))) {
      callback(filepath);
    }
  });
}

walkSync(SRC_DIR, (filepath) => {
  let content = fs.readFileSync(filepath, "utf8");
  let modified = false;

  // Pattern:
  // setMembers(getTeamMembers());
  // return subscribe(() => setMembers(getTeamMembers()));
  
  // Let's just do a generic replace for synchronous getter calls inside useEffects
  // This is too hard to Regex perfectly. Let's do something simpler.
  // We'll replace the exact subscribe patterns.
  
  const subscribeRegex = /set([A-Za-z]+)\((get[A-Za-z]+)\((.*?)\)\);\s*return subscribe\(\(\) => set\1\(\2\(\3\)\)\);/g;
  if (subscribeRegex.test(content)) {
    content = content.replace(subscribeRegex, (match, stateName, getterName, args) => {
       return `${getterName}(${args}).then(set${stateName});`;
    });
    modified = true;
  }
  
  // Handle cases where subscribe was assigned to a variable or just returned without initial set
  const subscribeRegex2 = /return subscribe\(\(\) => set([A-Za-z]+)\((get[A-Za-z]+)\((.*?)\)\)\);/g;
  if (subscribeRegex2.test(content)) {
    content = content.replace(subscribeRegex2, "");
    modified = true;
  }

  // Handle bare sync calls: setMembers(getTeamMembers()) -> getTeamMembers().then(setMembers)
  const syncSetRegex = /set([A-Za-z]+)\((get[A-Za-z]+)\((.*?)\)\);/g;
  if (syncSetRegex.test(content)) {
    content = content.replace(syncSetRegex, (match, stateName, getterName, args) => {
       return `${getterName}(${args}).then(set${stateName});`;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filepath, content, "utf8");
    console.log(`Updated ${filepath}`);
  }
});
