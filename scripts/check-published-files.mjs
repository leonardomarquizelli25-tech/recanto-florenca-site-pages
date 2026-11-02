import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const blockedNames = new Set([".git", ".npmrc", "node_modules", "package.json", "pnpm-lock.yaml"]);

export async function findUnsafePublishedFiles(root) {
  const unsafe = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      const name = entry.name.toLowerCase();
      if (
        entry.isSymbolicLink() ||
        blockedNames.has(name) ||
        /^\.env(?:\.|$)/.test(name) ||
        /\.(?:map|pem|key|p12|pfx)$/.test(name)
      ) {
        unsafe.push(path.relative(root, filename));
      } else if (entry.isDirectory()) {
        await walk(filename);
      }
    }
  }
  await walk(root);
  return unsafe.sort();
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../site-estatico");
  const root = process.argv[2] ? path.resolve(process.argv[2]) : defaultRoot;
  const unsafe = await findUnsafePublishedFiles(root);
  if (unsafe.length) {
    console.error(`Publicação bloqueada: arquivos internos ou de depuração: ${unsafe.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Diretório de publicação sem arquivos internos, credenciais ou source maps por nome.");
  }
}
