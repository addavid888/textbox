export function queryParser(input) {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const tags = [];
  const commands = [];
  let priority = "";
  const plainTerms = [];

  tokens.forEach((token) => {
    if (token.startsWith("#")) {
      const tag = token.slice(1).toLowerCase();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    } else if (token.startsWith("/")) {
      const command = token.slice(1).toLowerCase();
      if (command && !commands.includes(command)) {
        commands.push(command);
      }
    } else if (token.startsWith("!")) {
      const priorityToken = token.slice(1).toLowerCase();
      if (["urgent", "p1", "p2"].includes(priorityToken)) {
        priority = priorityToken;
      }
    } else {
      plainTerms.push(token.toLowerCase());
    }
  });

  return { tags, commands, priority, plainTerms };
}

export function filterNotes(notes, query) {
  if (!query.trim()) return notes.sort((a, b) => b.updatedAt - a.updatedAt);

  const { tags, commands, priority, plainTerms } = queryParser(query);

  let filtered = notes;

  // Apply token filters first
  if (tags.length > 0) {
    filtered = filtered.filter((note) =>
      tags.every((tag) => note.tags.includes(tag))
    );
  }

  if (commands.length > 0) {
    filtered = filtered.filter((note) =>
      commands.every((command) => note.commands.includes(command))
    );
  }

  if (priority) {
    filtered = filtered.filter((note) => note.priority === priority);
  }

  // Apply plain text search
  if (plainTerms.length > 0) {
    filtered = filtered.filter((note) => {
      const searchText = [
        note.text,
        ...note.tags,
        ...note.commands,
        note.priority,
      ]
        .join(" ")
        .toLowerCase();

      return plainTerms.every((term) => searchText.includes(term));
    });
  }

  // Sort by updatedAt desc
  return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
}
