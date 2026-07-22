import type { Monaco } from '@monaco-editor/react';

const THEME_NAME = 'triecode-dark';

/**
 * Monaco's bundled Python language dumps `self`, every builtin (`len`,
 * `str`, `list`, ...), and every dunder (`__init__`, ...) into the same
 * "keyword" bucket as real keywords, then colors that bucket blue — so the
 * live editor rendered `self`/`__init__`/builtins as if they were `def` or
 * `return`. This replaces that tokenizer with one that only tags real
 * Python keywords as keywords, and adds two things Monaco's stock grammar
 * never attempts: a class-name token right after `class`, and a
 * called-name token for any identifier immediately followed by `(` — the
 * same two distinctions ui/components/common/pythonHighlight.ts makes for
 * Learn's static code blocks, so the live editor and the lesson content
 * read as the same color scheme. (Real per-parameter coloring, which that
 * static highlighter also does, needs a whole-document pre-pass that
 * Monaco's incremental line-by-line tokenizer can't do — left as the one
 * remaining gap.)
 */
const KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
];

let registered = false;

export function registerPythonTheme(monaco: Monaco): string {
  if (registered) return THEME_NAME;
  registered = true;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- monaco-editor's own .d.ts isn't fully resolved by eslint's type-aware parser here; tsc typechecks this file cleanly.
  monaco.languages.setMonarchTokensProvider('python', {
    defaultToken: '',
    tokenPostfix: '.python',
    keywords: KEYWORDS,
    brackets: [
      { open: '{', close: '}', token: 'delimiter.curly' },
      { open: '[', close: ']', token: 'delimiter.bracket' },
      { open: '(', close: ')', token: 'delimiter.parenthesis' },
    ],
    tokenizer: {
      root: [
        { include: '@whitespace' },
        { include: '@numbers' },
        { include: '@strings' },
        [/[,:;]/, 'delimiter'],
        [/[{}[\]()]/, '@brackets'],
        [/@[a-zA-Z_]\w*/, 'tag'],
        [/(class)(\s+)([A-Za-z_]\w*)/, ['keyword', 'white', 'type.identifier']],
        [
          /[A-Za-z_]\w*(?=\s*\()/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'support.function',
            },
          },
        ],
        [
          /[A-Za-z_]\w*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
      ],
      whitespace: [
        [/\s+/, 'white'],
        [/(^#.*$)/, 'comment'],
        [/'''/, 'string', '@endDocString'],
        [/"""/, 'string', '@endDblDocString'],
      ],
      endDocString: [
        [/[^']+/, 'string'],
        [/\\'/, 'string'],
        [/'''/, 'string', '@popall'],
        [/'/, 'string'],
      ],
      endDblDocString: [
        [/[^"]+/, 'string'],
        [/\\"/, 'string'],
        [/"""/, 'string', '@popall'],
        [/"/, 'string'],
      ],
      numbers: [
        [/-?0x([abcdef]|[ABCDEF]|\d)+[lL]?/, 'number.hex'],
        [/-?(\d*\.)?\d+([eE][+-]?\d+)?[jJ]?[lL]?/, 'number'],
      ],
      strings: [
        [/'$/, 'string.escape', '@popall'],
        [/f'{1,3}/, 'string.escape', '@fStringBody'],
        [/'/, 'string.escape', '@stringBody'],
        [/"$/, 'string.escape', '@popall'],
        [/f"{1,3}/, 'string.escape', '@fDblStringBody'],
        [/"/, 'string.escape', '@dblStringBody'],
      ],
      fStringBody: [
        [/[^\\'{}]+$/, 'string', '@popall'],
        [/[^\\'{}]+/, 'string'],
        [/\{[^}':!=]+/, 'identifier', '@fStringDetail'],
        [/\\./, 'string'],
        [/'/, 'string.escape', '@popall'],
        [/\\$/, 'string'],
      ],
      stringBody: [
        [/[^\\']+$/, 'string', '@popall'],
        [/[^\\']+/, 'string'],
        [/\\./, 'string'],
        [/'/, 'string.escape', '@popall'],
        [/\\$/, 'string'],
      ],
      fDblStringBody: [
        [/[^\\"{}]+$/, 'string', '@popall'],
        [/[^\\"{}]+/, 'string'],
        [/\{[^}':!=]+/, 'identifier', '@fStringDetail'],
        [/\\./, 'string'],
        [/"/, 'string.escape', '@popall'],
        [/\\$/, 'string'],
      ],
      dblStringBody: [
        [/[^\\"]+$/, 'string', '@popall'],
        [/[^\\"]+/, 'string'],
        [/\\./, 'string'],
        [/"/, 'string.escape', '@popall'],
        [/\\$/, 'string'],
      ],
      fStringDetail: [
        [/[:][^}]+/, 'string'],
        [/[!][ars]/, 'string'],
        [/=/, 'string'],
        [/\}/, 'identifier', '@pop'],
      ],
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- same as above.
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.python', foreground: '569cd6' },
      { token: 'string.python', foreground: 'ce9178' },
      { token: 'string.escape.python', foreground: 'ce9178' },
      { token: 'number.python', foreground: 'b5cea8' },
      { token: 'number.hex.python', foreground: 'b5cea8' },
      { token: 'comment.python', foreground: '6a9955' },
      { token: 'support.function.python', foreground: 'dcdcaa' },
      { token: 'type.identifier.python', foreground: '4ec9b0' },
      { token: 'identifier.python', foreground: 'd4d4d4' },
    ],
    colors: {},
  });

  return THEME_NAME;
}
