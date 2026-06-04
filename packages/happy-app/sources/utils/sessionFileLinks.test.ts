import { describe, expect, it } from 'vitest';
import { parseSessionFileLink, resolveSessionFilePath, splitSessionFileText } from './sessionFileLinks';

describe('sessionFileLinks', () => {
    const sessionRoot = '<LOCAL_PATH>';

    it('parses absolute file refs with line numbers', () => {
        const result = parseSessionFileLink('<LOCAL_PATH>', {
            sessionRoot,
        });

        expect(result).toEqual({
            path: '<LOCAL_PATH>',
            absolutePath: '<LOCAL_PATH>',
            relativePath: 'packages/happy-cli/src/codex/runCodex.ts',
            withinSessionRoot: true,
            line: 594,
            column: null,
        });
    });

    it('parses relative file refs with line and column numbers', () => {
        const result = parseSessionFileLink('packages/happy-cli/src/codex/runCodex.ts:594:2', {
            sessionRoot,
        });

        expect(result).toEqual({
            path: 'packages/happy-cli/src/codex/runCodex.ts',
            absolutePath: '<LOCAL_PATH>',
            relativePath: 'packages/happy-cli/src/codex/runCodex.ts',
            withinSessionRoot: true,
            line: 594,
            column: 2,
        });
    });

    it('rejects external urls', () => {
        expect(parseSessionFileLink('https://openai.com', { sessionRoot })).toBeNull();
        expect(parseSessionFileLink('mailto:maintainer@example.com', { sessionRoot })).toBeNull();
    });

    it('splits bare text into plain and linked segments', () => {
        const result = splitSessionFileText('Open packages/happy-cli/src/codex/runCodex.ts:594 please.', sessionRoot);

        expect(result).toEqual([
            { text: 'Open ', link: null },
            {
                text: 'packages/happy-cli/src/codex/runCodex.ts:594',
                link: {
                    path: 'packages/happy-cli/src/codex/runCodex.ts',
                    absolutePath: '<LOCAL_PATH>',
                    relativePath: 'packages/happy-cli/src/codex/runCodex.ts',
                    withinSessionRoot: true,
                    line: 594,
                    column: null,
                },
            },
            { text: ' please.', link: null },
        ]);
    });

    it('splits absolute bare file refs with spaces into linked segments', () => {
        const result = splitSessionFileText(
            'Image: <LOCAL_PATH> Support/CleanShot/media/test/CleanShot 2026-03-19 at maintainer@example.com',
            sessionRoot,
        );

        expect(result).toEqual([
            { text: 'Image: ', link: null },
            {
                text: '<LOCAL_PATH> Support/CleanShot/media/test/CleanShot 2026-03-19 at maintainer@example.com',
                link: {
                    path: '<LOCAL_PATH> Support/CleanShot/media/test/CleanShot 2026-03-19 at maintainer@example.com',
                    absolutePath: '<LOCAL_PATH> Support/CleanShot/media/test/CleanShot 2026-03-19 at maintainer@example.com',
                    relativePath: null,
                    withinSessionRoot: false,
                    line: null,
                    column: null,
                },
            },
        ]);
    });

    it('does not turn version numbers into file refs', () => {
        expect(splitSessionFileText('Version 1.2.3 shipped.', sessionRoot)).toEqual([
            { text: 'Version 1.2.3 shipped.', link: null },
        ]);
    });

    it('does not turn slash-separated prose into file refs', () => {
        expect(splitSessionFileText(
            'Codex then starts/resumes turns with backend default model. I’m checking CLI docs/tests to confirm there is intentionally no happy codex model set or --model surface today.',
            sessionRoot,
        )).toEqual([
            {
                text: 'Codex then starts/resumes turns with backend default model. I’m checking CLI docs/tests to confirm there is intentionally no happy codex model set or --model surface today.',
                link: null,
            },
        ]);
    });

    it('resolves viewer input to an absolute path', () => {
        expect(resolveSessionFilePath('packages/happy-app/README.md', sessionRoot)).toEqual({
            path: 'packages/happy-app/README.md',
            absolutePath: '<LOCAL_PATH>',
            relativePath: 'packages/happy-app/README.md',
            withinSessionRoot: true,
            line: null,
            column: null,
        });
    });
});
