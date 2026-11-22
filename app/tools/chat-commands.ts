const commandNames = ['roll', 'help', 'showhelp'] as const;

export function findChatCommand(name: string) {
  const normalized = name.toLowerCase();
  return commandNames.find((command) => command === (normalized === 'dice' ? 'roll' : normalized));
}

export function parseChatCommand(html: string) {
  const match = /^<p>\s*\/([a-z]+)(?:[ \t]+([^<>\r\n]*))?\s*<\/p>$/i.exec(html);
  if (!match) return null;
  const name = findChatCommand(match[1]);
  return name ? { name, argument: (match[2] ?? '').trim() } : null;
}
