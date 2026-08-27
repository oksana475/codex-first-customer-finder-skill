#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

function usage() {
  console.log(`
Codex Customer Discovery Skills installer

Usage:
  npx codex-first-customer-finder-skill
  codex-first-customer-finder-skill --skills-dir ~/.codex/skills

Options:
  --skills-dir PATH  Install into a custom Codex skills directory
  --help             Show this help
`);
}

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--skills-dir") {
      const value = argv[index + 1];
      if (!value) throw new Error("--skills-dir requires a value");
      options.skillsDir = expandHome(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function defaultSkillsDir() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  return path.join(codexHome, "skills");
}

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(sourcePath, destinationPath);
    else if (entry.isFile()) fs.copyFileSync(sourcePath, destinationPath);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const skillsDir = path.resolve(options.skillsDir || defaultSkillsDir());
  fs.mkdirSync(skillsDir, { recursive: true });

  const skillNames = ["first-customer-finder", "custdev-interviewer"];
  for (const skillName of skillNames) {
    const source = path.resolve(__dirname, "..", skillName);
    const destination = path.join(skillsDir, skillName);
    if (!fs.existsSync(source)) throw new Error(`Cannot find bundled skill at ${source}`);
    fs.rmSync(destination, { recursive: true, force: true });
    copyDirectory(source, destination);
    console.log(`Installed ${skillName} skill.`);
    console.log(`Location: ${destination}`);
  }

  console.log("");
  console.log("Restart Codex, then run:");
  console.log("  Use $first-customer-finder to find ten potential first customers for https://example.com.");
  console.log("  Use $custdev-interviewer to conduct a CustDev interview one question at a time.");
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
