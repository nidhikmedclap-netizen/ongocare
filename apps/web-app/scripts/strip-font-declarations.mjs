import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

function walk(dir, onFile) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

let count = 0;

walk(root, (file) => {
  if (!file.endsWith(".css") || file.endsWith("globals.css")) return;

  let content = fs.readFileSync(file, "utf8");
  const original = content;

  // Redundant — inherited from html/body via globals.css
  content = content.replace(/^\s*font-family:\s*var\(--font-site\);\s*\n/gm, "");
  content = content.replace(/^\s*font-family:\s*inherit;\s*\n/gm, "");

  if (content !== original) {
    fs.writeFileSync(file, content);
    count += 1;
  }
});

console.log(`Stripped redundant font-family from ${count} CSS files.`);
