// Dependency-free test runner integration using the project's TypeScript compiler.
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "next/server" || specifier === "next/headers") return next(specifier + ".js", context);
    if (specifier.startsWith("@/") || (specifier.startsWith(".") && /\.tsx?$/.test(context.parentURL ?? ""))) {
      const base = specifier.startsWith("@/") ? resolve(root, "src", specifier.slice(2)) : fileURLToPath(new URL(specifier, context.parentURL));
      for (const candidate of [base, base + ".ts", base + ".tsx", resolve(base, "index.ts")]) {
        if (/\.tsx?$/.test(candidate) && existsSync(candidate)) return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (/\.tsx?$/.test(url)) return {
      format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    };
    return next(url, context);
  },
});
