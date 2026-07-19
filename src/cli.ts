#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { toHtml } from 'hast-util-to-html';
import { extractMarkdownHeadings } from './extract-markdown-headings.js';
import { extractPlainText } from './extract-plain-text.js';
import { normalizeInkstreamMarkdown } from './normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from './remark-plugins.js';

const USAGE = `Usage: inkstream <command> [file]

Commands:
  render <file|->      Render markdown to HTML (unstyled custom elements;
                        no heading ids -- those are added by the React
                        renderer, not this pipeline)
  text <file|->         Extract plain, human-readable text (for search
                        indexing, excerpts, OGP descriptions)
  headings <file|-> [--json] [--prefix=<prefix>]
                        List headings as a JSON array (--json) or an
                        indented outline (default)

Pass "-" or omit the file to read markdown from stdin.
`;

const renderProcessor = unified()
    .use(remarkParse)
    .use(inkstreamRemarkPlugins)
    .use(remarkRehype, { allowDangerousHtml: true });

function readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
        process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        process.stdin.on('error', reject);
    });
}

async function readInput(pathArg: string | undefined): Promise<string> {
    if (!pathArg || pathArg === '-') {
        return readStdin();
    }

    return readFileSync(pathArg, 'utf8');
}

function renderCommand(markdown: string): string {
    const file = normalizeInkstreamMarkdown(markdown);
    const hast = renderProcessor.runSync(renderProcessor.parse(file));

    return toHtml(hast as Parameters<typeof toHtml>[0]);
}

function headingsCommand(markdown: string, args: string[]): string {
    const json = args.includes('--json');
    const prefixArg = args.find((arg) => arg.startsWith('--prefix='));
    const prefix = prefixArg?.slice('--prefix='.length);
    const headings = extractMarkdownHeadings(markdown, prefix);

    if (json) {
        return JSON.stringify(headings, null, 2);
    }

    return headings
        .map((heading) => `${'  '.repeat(heading.level - 1)}${heading.text}`)
        .join('\n');
}

export interface CliResult {
    exitCode: number;
    output: string;
}

/**
 * Runs the CLI against explicit argv (excluding the node/script path) and
 * markdown source, returning the result instead of touching process.stdout
 * / process.exit, so it's directly testable. The bottom of this module
 * wires this to the real process for the actual `inkstream` binary.
 */
export async function runCli(argv: string[], markdown?: string): Promise<CliResult> {
    const [command, ...rest] = argv;

    if (!command || command === '--help' || command === '-h') {
        return { exitCode: command ? 0 : 1, output: USAGE };
    }

    const pathArg = rest.find((arg) => !arg.startsWith('--'));
    const input = markdown ?? (await readInput(pathArg));

    switch (command) {
        case 'render':
            return { exitCode: 0, output: renderCommand(input) };
        case 'text':
            return { exitCode: 0, output: extractPlainText(input) };
        case 'headings':
            return { exitCode: 0, output: headingsCommand(input, rest) };
        default:
            return {
                exitCode: 1,
                output: `Unknown command: ${command}\n\n${USAGE}`,
            };
    }
}

// npm's bin/ entries are symlinks (e.g. node_modules/.bin/inkstream ->
// .../dist/cli.js); import.meta.url reflects the resolved real path, so
// comparing it against the unresolved argv[1] never matches when
// invoked through the symlink, silently skipping this block entirely.
// realpathSync resolves argv[1] the same way first.
const isMain =
    typeof process.argv[1] === 'string' &&
    import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (isMain) {
    const result = await runCli(process.argv.slice(2));

    if (result.output) {
        (result.exitCode === 0 ? process.stdout : process.stderr).write(
            `${result.output}\n`,
        );
    }

    process.exitCode = result.exitCode;
}
