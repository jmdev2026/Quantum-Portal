import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

// Mirrors the "@/*" -> "src/*" path alias from tsconfig.json for Node's test runner.
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = SRC + specifier.slice(2);
    const file = [base, `${base}.ts`, `${base}.tsx`].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (file) return next(pathToFileURL(file).href, context);
  }
  return next(specifier, context);
}
