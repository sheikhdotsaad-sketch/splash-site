// Netlify build: copy the static site into dist/ so node_modules,
// the functions folder and config files are never published.
import { cpSync, rmSync } from "node:fs";
import path from "node:path";

const skip = new Set(["node_modules", "netlify", "dist", ".git", ".claude", "package.json", "package-lock.json", "build.mjs", "netlify.toml", "README.md"]);
rmSync("dist", { recursive: true, force: true });
cpSync(".", "dist", {
  recursive: true,
  filter: (src) => {
    const first = path.relative(".", src).split(path.sep)[0];
    return first === "" || !skip.has(first);
  },
});
console.log("Copied site to dist/");
