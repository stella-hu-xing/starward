import type { ReactNode } from 'react';

/** Minimal, dependency-free Markdown-ish renderer.
 *
 * Supports paragraphs, "- " bullet lists, **bold**, *italic*, and `code`.
 * It builds React nodes only and never renders raw HTML, matching the
 * safe-rendering rules in AGENTS.md.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = new RegExp(INLINE_PATTERN);
  let lastIndex = 0;
  let index = 0;
  let match = pattern.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <code className="md-code" key={key}>
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    index += 1;
    lastIndex = match.index + token.length;
    match = pattern.exec(text);
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

interface MarkdownLiteProps {
  text: string;
}

function MarkdownLite({ text }: MarkdownLiteProps) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
  return (
    <div className="md-root">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim());
        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <ul className="md-list" key={blockIndex}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.slice(2), `${blockIndex}-${lineIndex}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p className="md-p" key={blockIndex}>
            {renderInline(lines.join(' '), `${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
}

export default MarkdownLite;
