import { STORAGE_KEY } from "../constants/keys";

export function loadNotes() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const notes = JSON.parse(data);
    if (!Array.isArray(notes)) {
      throw new Error("Invalid notes format");
    }

    // Validate note structure
    return notes.filter(
      (note) =>
        note &&
        typeof note.id === "string" &&
        typeof note.text === "string" &&
        Array.isArray(note.tags) &&
        Array.isArray(note.commands) &&
        typeof note.priority === "string" &&
        typeof note.createdAt === "number" &&
        typeof note.updatedAt === "number"
    );
  } catch (error) {
    console.error("Storage corrupted, resetting:", error);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    throw new Error("Storage corrupted. Reset.");
  }
}

export function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return notes;
  } catch (error) {
    console.error("Failed to save notes:", error);
    throw error;
  }
}

export function addNote(note) {
  const notes = loadNotes();
  const newNotes = [note, ...notes];
  return saveNotes(newNotes);
}

export function updateNote(updatedNote) {
  const notes = loadNotes();
  const newNotes = notes.map((note) =>
    note.id === updatedNote.id ? updatedNote : note
  );
  return saveNotes(newNotes);
}

export function deleteNote(id) {
  const notes = loadNotes();
  const newNotes = notes.filter((note) => note.id !== id);
  return saveNotes(newNotes);
}
