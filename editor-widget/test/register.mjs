// Run the real TypeScript modules with Node's test runner; no production mocks
// or test framework are shipped in the widget ZIP.
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
      for (const suffix of ['', '.ts', '.tsx', '/index.ts']) {
        const url = new URL(specifier + suffix, context.parentURL);
        if (/\.tsx?$/.test(url.pathname) && existsSync(url)) return { url: url.href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (/\.tsx?$/.test(url)) {
      const source = readFileSync(fileURLToPath(url), 'utf8').replace(/import\.meta\.env\.DEV/g, 'false').replace(/import\.meta\.env\.PROD/g, 'true');
      return { format: 'module', shortCircuit: true, source: transformSync(fileURLToPath(url), source, { jsx: { runtime: 'automatic' } }).code };
    }
    return next(url, context);
  },
});
