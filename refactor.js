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

  // Replace mock-session imports
  if (content.includes("@/lib/mock-session")) {
    content = content.replace(/@\/lib\/mock-session/g, "@/lib/session");
    modified = true;
  }
  
  // Replace mock-db imports
  if (content.includes("@/lib/mock-db")) {
    content = content.replace(/@\/lib\/mock-db/g, "@/lib/api");
    modified = true;
  }

  // Remove DEMO_USERS usages
  if (content.includes("DEMO_USERS")) {
    content = content.replace(/DEMO_USERS\s*,\s*/g, "");
    content = content.replace(/,\s*DEMO_USERS/g, "");
    content = content.replace(/DEMO_USERS/g, "[]");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filepath, content, "utf8");
    console.log(`Updated ${filepath}`);
  }
});
