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
 * Colors match VS Code's Dark+ theme (keywords blue, strings orange,
 * comments green, numbers pale green, called names yellow) so Learn's static
 * code blocks read as visually continuous with the live Monaco editor
 * elsewhere in the app, which uses the same theme.
 */
const TOKEN_PATTERN =
  /(#[^\n]*)|('''[\s\S]*?'''|"""[\s\S]*?"""|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z0-9_]+)/g;

export function highlightPython(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const pattern = new RegExp(TOKEN_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(code))) {
    const [, comment, string, number, identifier, whitespace, punctuation] = match;
    if (comment) {
      tokens.push({ text: comment, className: 'text-[#6a9955]' });
    } else if (string) {
      tokens.push({ text: string, className: 'text-[#ce9178]' });
    } else if (number) {
      tokens.push({ text: number, className: 'text-[#b5cea8]' });
    } else if (identifier) {
      if (KEYWORDS.has(identifier)) {
        tokens.push({ text: identifier, className: 'text-[#569cd6]' });
      } else if (/^\s*\(/.test(code.slice(pattern.lastIndex))) {
        tokens.push({ text: identifier, className: 'text-[#dcdcaa]' });
      } else {
        tokens.push({ text: identifier });
      }
    } else if (whitespace) {
      tokens.push({ text: whitespace });
    } else if (punctuation) {
      tokens.push({ text: punctuation });
    }
  }
  return tokens;
}
