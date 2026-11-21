export function pollText(html: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: '\'',
    nbsp: '\u{A0}',
  };
  return html
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code: string) => {
      if (!code.startsWith('#')) return entities[code.toLowerCase()] ?? entity;
      const isHex = code[1].toLowerCase() === 'x';
      const point = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return point > 0 && point <= 1_114_111 ? String.fromCodePoint(point) : entity;
    });
}
