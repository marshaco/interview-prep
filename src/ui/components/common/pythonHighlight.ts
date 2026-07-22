export interface HighlightToken {
  text: string;
  className?: string;
}

const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]);

/**
 * Colors match VS Code's Dark+ theme *with Python semantic highlighting*
 * (i.e. what the Python extension + Pylance actually render, not Monaco's
 * much cruder built-in Python tokenizer — verified directly against a real
 * VS Code screenshot, not just the base grammar's keyword/string/comment
 * colors): keywords blue, strings orange, comments green, numbers pale
 * green, class names teal, parameters/self light blue, called names yellow.
 */
const KEYWORD_COLOR = 'text-[#569cd6]';
const STRING_COLOR = 'text-[#ce9178]';
const COMMENT_COLOR = 'text-[#6a9955]';
const NUMBER_COLOR = 'text-[#b5cea8]';
const CALL_COLOR = 'text-[#dcdcaa]';
const CLASS_COLOR = 'text-[#4ec9b0]';
const PARAM_COLOR = 'text-[#9cdcfe]';

const TOKEN_PATTERN =
  /(#[^\n]*)|('''[\s\S]*?'''|"""[\s\S]*?"""|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z0-9_]+)/g;

/**
 * Parameter names (plus `self`/`cls`, always parameters by convention)
 * collected from every `def name(...)` signature in the snippet. A flat
 * name-set rather than real scope tracking — good enough for the short,
 * single-function-or-class lesson snippets this ever runs on, where a
 * parameter name isn't going to collide with an unrelated variable.
 */
function extractParameterNames(code: string): Set<string> {
  const names = new Set<string>(['self', 'cls']);
  const defPattern = /\bdef\s+\w+\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = defPattern.exec(code))) {
    const paramList = match[1];
    if (!paramList) continue;
    for (const rawParam of paramList.split(',')) {
      const withoutDefault = rawParam.split('=')[0] ?? '';
      const withoutAnnotation = withoutDefault.split(':')[0] ?? '';
      const name = withoutAnnotation.trim().replace(/^\*+/, '');
      if (name) names.add(name);
    }
  }
  return names;
}

export function highlightPython(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const pattern = new RegExp(TOKEN_PATTERN);
  const parameterNames = extractParameterNames(code);
  let prevSignificant = '';

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(code))) {
    const [, comment, string, number, identifier, whitespace, punctuation] = match;
    if (comment) {
      tokens.push({ text: comment, className: COMMENT_COLOR });
    } else if (string) {
      tokens.push({ text: string, className: STRING_COLOR });
      prevSignificant = string;
    } else if (number) {
      tokens.push({ text: number, className: NUMBER_COLOR });
      prevSignificant = number;
    } else if (identifier) {
      // An attribute right after a dot (`self.val`) is never a class-name
      // reference or a parameter reference — only the plain name (`val` as
      // the assigned-from value, not `.val` the attribute) gets those.
      const isAttribute = prevSignificant === '.';
      const isCalled = /^\s*\(/.test(code.slice(pattern.lastIndex));

      if (KEYWORDS.has(identifier)) {
        tokens.push({ text: identifier, className: KEYWORD_COLOR });
      } else if (!isAttribute && prevSignificant === 'class') {
        tokens.push({ text: identifier, className: CLASS_COLOR });
      } else if (isCalled) {
        tokens.push({ text: identifier, className: CALL_COLOR });
      } else if (!isAttribute && parameterNames.has(identifier)) {
        tokens.push({ text: identifier, className: PARAM_COLOR });
      } else {
        tokens.push({ text: identifier });
      }
      prevSignificant = identifier;
    } else if (whitespace) {
      tokens.push({ text: whitespace });
    } else if (punctuation) {
      tokens.push({ text: punctuation });
      prevSignificant = punctuation;
    }
  }
  return tokens;
}
