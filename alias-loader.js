import { resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolvePath(__dirname);

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('~/')) {
    const newSpecifier = resolvePath(projectRoot, specifier.slice(2));
    return nextResolve(newSpecifier, context);
  }
  return nextResolve(specifier, context);
}