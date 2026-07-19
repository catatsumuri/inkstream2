import { chmodSync, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

// Non-TypeScript files tsc's build won't emit on its own.
const ASSETS = ['src/react/styles.css'];

for (const relativePath of ASSETS) {
    const source = join(ROOT, relativePath);
    const destination = join(ROOT, 'dist', relativePath.slice('src/'.length));

    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
}

// tsc doesn't carry over source files' executable bit; without this,
// dist/cli.js's shebang is inert and `npm link`/a package.json "bin"
// entry can't run it directly.
chmodSync(join(ROOT, 'dist/cli.js'), 0o755);
