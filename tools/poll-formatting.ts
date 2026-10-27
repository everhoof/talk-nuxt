export function pollText(html: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00A0',
  };
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code: string) => {
      if (!code.startsWith('#')) return entities[code.toLowerCase()] ?? entity;
      const hex = code[1].toLowerCase() === 'x';
      const point = parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return point > 0 && point <= 1114111 ? String.fromCodePoint(point) : entity;
    });
}
