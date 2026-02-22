/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const ALLOWED_FILE = path.join(SRC_DIR, "lib", "formatTimestamp.ts");

const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const forbiddenPatterns = [
  {
    label: "Direct locale formatting outside formatter",
    regex:
      /new\s+Date\([^\n]*\)\s*\.\s*(toLocaleString|toLocaleDateString|toLocaleTimeString)\s*\(/g,
  },
  {
    label: "UTC day-key slicing via toISOString",
    regex: /toISOString\(\)\s*\.\s*split\(\s*["']T["']\s*\)\s*\[\s*0\s*\]/g,
  },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }

    if (!FILE_EXTENSIONS.has(path.extname(entry.name))) continue;
    out.push(fullPath);
  }
  return out;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

const files = walk(SRC_DIR);
const violations = [];

for (const file of files) {
  if (file === ALLOWED_FILE) continue;

  const content = fs.readFileSync(file, "utf8");

  for (const pattern of forbiddenPatterns) {
    pattern.regex.lastIndex = 0;
    let match;

    while ((match = pattern.regex.exec(content)) !== null) {
      violations.push({
        file: path.relative(ROOT, file).replace(/\\/g, "/"),
        line: getLineNumber(content, match.index),
        label: pattern.label,
        snippet: match[0],
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Timezone contract violations found:\n");
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} | ${v.label}`);
    console.error(`  ${v.snippet}`);
  }
  process.exit(1);
}

console.log("Timezone contract check passed.");
