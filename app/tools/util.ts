import { toUnicode } from 'punycode/';

// [0, 1)
export function getRandomIntInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomString(length = 64): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16))
    .join('');
}

export function getUserColor(id?: number) {
  const colors = [
    '#EF5350',
    '#AB47BC',
    '#7E57C2',
    '#5C6BC0',
    '#42A5F5',
    '#26A69A',
    '#66BB6A',
    '#FFA726',
    '#FF7043',
    '#8D6E63',
  ];
  return id ? colors[(id - 1) % colors.length] : '#BDBDBD';
}

export function decodePunycodeURL(input: string): string {
  const url = new URL(input);
  url.host = toUnicode(url.host);
  return decodeURI(input.replace(url.host, () => toUnicode(url.host)));
}
