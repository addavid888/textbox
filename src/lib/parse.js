const TAG_REGEX = /(^|\s)#([a-z0-9_-]{1,30})/gi;
const COMMAND_REGEX = /(^|\s)\/([a-z][a-z0-9_-]{1,30})/gi;
const PRIORITY_REGEX = /(^|\s)!((urgent|p1|p2))/i;

function normalizeToken(token) {
  return token.toLowerCase().replace(/[,.;:)]+$/, "");
}

export function parseTokens(text) {
  const tags = [];
  const commands = [];
  let priority = "";

  // Extract tags
  let match;
  TAG_REGEX.lastIndex = 0;
  while ((match = TAG_REGEX.exec(text)) !== null) {
    const tag = normalizeToken(match[2]);
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // Extract commands
  COMMAND_REGEX.lastIndex = 0;
  while ((match = COMMAND_REGEX.exec(text)) !== null) {
    const command = normalizeToken(match[2]);
    if (command && !commands.includes(command)) {
      commands.push(command);
    }
  }

  // Extract priority (first match wins)
  const priorityMatch = text.match(PRIORITY_REGEX);
  if (priorityMatch) {
    priority = normalizeToken(priorityMatch[2]);
  }

  return { tags, commands, priority };
}

export function createNote(text) {
  const { tags, commands, priority } = parseTokens(text);
  const now = Date.now();

  return {
    id: generateId(),
    text: text.trim(),
    tags,
    commands,
    priority,
    createdAt: now,
    updatedAt: now,
  };
}

// Simple timestamp-based ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
