import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const backendDir = path.dirname(currentFile);
const projectRoot = path.resolve(backendDir, "..");
const envPaths = [
  path.resolve(backendDir, ".env"),
  path.resolve(projectRoot, ".env"),
];

for (const envPath of envPaths) {
  if (!fs.existsSync(envPath)) {
    continue;
  }

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(
      `Unable to load environment file at ${envPath}:`,
      result.error,
    );
  }

  break;
}
