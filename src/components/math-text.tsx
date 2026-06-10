import katex from "katex";

/**
 * Renders a string that mixes plain text with KaTeX math. Inline math is
 * wrapped in `$...$` and block math in `$$...$$`. Pure (no hooks / no window),
 * so it works in both Server and Client Components. Plain text is escaped.
 */
export function MathText({
  text,
  className,
  block,
}: {
  text: string;
  className?: string;
  block?: boolean;
}) {
  return (
    <span
      className={className}
      // KaTeX output + our own escaping of the plain-text parts.
      dangerouslySetInnerHTML={{ __html: toHtml(text, block) }}
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode });
  } catch {
    return escapeHtml(tex);
  }
}

const MATH_RE = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;

function toHtml(text: string, blockDefault?: boolean): string {
  let html = "";
  let last = 0;
  for (const m of text.matchAll(MATH_RE)) {
    const index = m.index ?? 0;
    if (index > last) html += escapeHtml(text.slice(last, index));
    if (m[1] != null) html += renderMath(m[1], true);
    else html += renderMath(m[2], !!blockDefault);
    last = index + m[0].length;
  }
  if (last < text.length) html += escapeHtml(text.slice(last));
  return html;
}
