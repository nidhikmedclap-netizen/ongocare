import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const siteFont = "var(--font-site)";

const replacements = [
  [
    /font-family:\s*var\(--font-teachers\),\s*"Teachers",\s*Georgia,\s*"Times New Roman",\s*serif;/g,
    `font-family: ${siteFont};`,
  ],
  [
    /font-family:\s*var\(--font-teachers\),\s*"Teachers",\s*"Helvetica Neue",\s*Arial,\s*sans-serif;/g,
    `font-family: ${siteFont};`,
  ],
  [
    /font-family:\s*var\(--font-teachers\),\s*"Teachers",\s*Georgia,\s*serif;/g,
    `font-family: ${siteFont};`,
  ],
  [/font-family:\s*Georgia,\s*"Times New Roman",\s*serif;/g, `font-family: ${siteFont};`],
  [/font-family:\s*"Inter",\s*"Teachers",\s*sans-serif;/g, `font-family: ${siteFont};`],
  [
    /font-family:\s*-apple-system,\s*BlinkMacSystemFont,\s*'Inter',\s*'Segoe UI',\s*sans-serif;/g,
    `font-family: ${siteFont};`,
  ],
  [
    /font-family:\s*-apple-system,\s*BlinkMacSystemFont,\s*"Inter",\s*"Segoe UI",\s*sans-serif;/g,
    `font-family: ${siteFont};`,
  ],
  [/font-family:\s*'Georgia',\s*'Times New Roman',\s*serif;/g, `font-family: ${siteFont};`],
  [/font-family:\s*ui-monospace,\s*[^;]+;/g, `font-family: ${siteFont};`],
];

const jsxReplacements = [
  ['fontFamily: "system-ui, sans-serif"', 'fontFamily: \'var(--font-site)\''],
  ['fontFamily: "ui-monospace, Menlo, monospace"', 'fontFamily: \'var(--font-site)\''],
  ['fontFamily: "ui-monospace, SFMono-Regular, monospace"', 'fontFamily: \'var(--font-site)\''],
  ["fontFamily: 'ui-monospace, Menlo, monospace'", "fontFamily: 'var(--font-site)'"],
  [
    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'var(--font-teachers), "Teachers", sans-serif',
  ],
  ["font-family: ui-monospace, Menlo, monospace", "font-family: var(--font-site)"],
];

function walk(dir, onFile) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

let cssCount = 0;
let jsxCount = 0;

walk(root, (file) => {
  if (file.endsWith(".css")) {
    let content = fs.readFileSync(file, "utf8");
    const original = content;
    for (const [pattern, replacement] of replacements) {
      content = content.replace(pattern, replacement);
    }
    if (content !== original) {
      fs.writeFileSync(file, content);
      cssCount += 1;
    }
    return;
  }

  if (file.endsWith(".jsx") || file.endsWith(".js")) {
    let content = fs.readFileSync(file, "utf8");
    const original = content;
    for (const [from, to] of jsxReplacements) {
      content = content.split(from).join(to);
    }
    if (content !== original) {
      fs.writeFileSync(file, content);
      jsxCount += 1;
    }
  }
});

console.log(`Updated ${cssCount} CSS files and ${jsxCount} JS/JSX files.`);
