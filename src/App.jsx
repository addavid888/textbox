import { useState, useEffect, useRef, useCallback } from "react";
import CaptureBox from "./components/CaptureBox";
import {
  MAX_NOTE_PREVIEW_LENGTH,
  MAX_SPOTLIGHT_RESULTS,
} from "./constants/keys";
import SearchBar from "./components/SearchBar";
import NoteItem from "./components/NoteItem";
import Toast from "./components/Toast";
import { loadNotes, addNote, updateNote, deleteNote } from "./lib/storage";
import { createNote, parseTokens } from "./lib/parse";
import { filterNotes } from "./lib/query";
import { setupHotkeys } from "./utils/hotkeys";
import "./styles/index.css";

function App() {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const [activeTab, setActiveTab] = useState("note"); // 'note', 'allNotes'
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null); // Note being edited, null for new note
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const searchBarRef = useRef(null);

  useEffect(() => {
    try {
      const loadedNotes = loadNotes();
      setNotes(loadedNotes);
    } catch (error) {
      console.error(error);
      setToast({
        message: "Storage corrupted. Reset.",
        type: "error",
      });
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    const cleanup = setupHotkeys({
      onFocusSearch: () => {
        if (isSpotlightOpen) {
          if (searchBarRef.current?.focusSearch) {
            searchBarRef.current.focusSearch();
          }
        } else {
          setIsSpotlightOpen(true);
        }
      },
      onEscape: () => {
        if (isSpotlightOpen) {
          setIsSpotlightOpen(false);
          setQuery("");
        } else {
          document.activeElement?.blur();
        }
      },
    });

    // Add tab navigation shortcuts
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === "1") {
        e.preventDefault();
        setActiveTab("note");
      } else if (cmdOrCtrl && e.key === "2") {
        e.preventDefault();
        setActiveTab("allNotes");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cleanup();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSpotlightOpen]);

  const handleSaveNote = (text) => {
    try {
      if (editingNote) {
        // Update existing note
        const { tags, commands, priority } = parseTokens(text);
        const updatedNote = {
          ...editingNote,
          text,
          tags,
          commands,
          priority,
          updatedAt: Date.now(),
        };
        const updatedNotes = updateNote(updatedNote);
        setNotes(updatedNotes);
        setEditingNote(null); // Clear editing state
      } else {
        // Create new note
        const note = createNote(text);
        const updatedNotes = addNote(note);
        setNotes(updatedNotes);
      }
    } catch (error) {
      console.error(error);
      setToast({
        message: "Failed to save note",
        type: "error",
      });
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setActiveTab("note"); // Switch to note tab
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  const handleUpdateNote = (noteId, newText) => {
    try {
      const existingNote = notes.find((n) => n.id === noteId);
      if (!existingNote) return;

      const { tags, commands, priority } = parseTokens(newText);
      const updatedNote = {
        ...existingNote,
        text: newText,
        tags,
        commands,
        priority,
        updatedAt: Date.now(),
      };

      const updatedNotes = updateNote(updatedNote);
      setNotes(updatedNotes);
    } catch (error) {
      console.error(error);
      setToast({
        message: "Failed to update note",
        type: "error",
      });
    }
  };

  const handleDeleteNote = (noteId) => {
    try {
      const updatedNotes = deleteNote(noteId);
      setNotes(updatedNotes);
    } catch (error) {
      console.error(error);

      setToast({
        message: "Failed to delete note",
        type: "error",
      });
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(notes, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "notes_v1.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      setToast({
        message: "Export failed",
        type: "error",
      });
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedNotes = JSON.parse(e.target.result);
        if (!Array.isArray(importedNotes)) {
          throw new Error("Invalid format");
        }

        // Merge by ID, overwrite existing
        const existingIds = new Set(notes.map((n) => n.id));
        const mergedNotes = [...notes];

        importedNotes.forEach((importedNote) => {
          if (existingIds.has(importedNote.id)) {
            const index = mergedNotes.findIndex(
              (n) => n.id === importedNote.id
            );
            mergedNotes[index] = importedNote;
          } else {
            mergedNotes.push(importedNote);
          }
        });

        setNotes(mergedNotes);
        setToast({
          message: "Import successful",
          type: "success",
        });
      } catch (error) {
      console.error(error);

        setToast({
          message: "Import failed: invalid format",
          type: "error",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleOpenSpotlight = useCallback(() => {
    setIsSpotlightOpen(true);
  }, []);

  const handleCloseSpotlight = useCallback(() => {
    setIsSpotlightOpen(false);
  }, []);

  const handleSpotlightQueryChange = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  const filteredNotes = filterNotes(notes, query);

  return (
    <div className="app">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
      {/* Tab Navigator */}
      <nav className="tab-navigator">
        {activeTab === "note" ? (
          <div
            className={`tab-unsaved-indicator ${
              editingNote ? "editing" : "new"
            }`}
          >
            {editingNote ? (
              <span className="indicator-editing-text ">
                Editing Note <br />
                <span className="indicator-note-title">
                  {editingNote.text
                    ? editingNote.text.split("\n")[0]
                    : "Untitled"}
                </span>
              </span>
            ) : (
              "New Note"
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === "note" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("note")}
            title="Cmd/Ctrl + 1"
          >
            <span>Note</span>
            <kbd className="kbd" style={{ marginLeft: "8px" }}>
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="kbd">1</kbd>
          </button>
          <button
            className={`tab-button ${
              activeTab === "allNotes" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("allNotes")}
            title="Cmd/Ctrl + 2"
          >
            <span>All Notes</span>
            <kbd className="kbd" style={{ marginLeft: "8px" }}>
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="kbd">2</kbd>
          </button>
        </div>
      </nav>
      {/* Tab Content */}
      {activeTab === "note" && (
        <header className="app-header">
          <CaptureBox
            onSave={handleSaveNote}
            notes={notes}
            onShowToast={setToast}
            editingNote={editingNote}
            onCancelEdit={handleCancelEdit}
          />
        </header>
      )}
      {activeTab === "allNotes" && (
        <main className="app-main">
          <SearchBar
            ref={searchBarRef}
            query={query}
            onQueryChange={setQuery}
            onFocus={handleOpenSpotlight}
            isSpotlightMode={false}
          />

          <div className="results-header">
            <span>{filteredNotes.length} results</span>
          </div>

          <div className="notes-list">
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onUpdate={(text) => handleUpdateNote(note.id, text)}
                onDelete={() => handleDeleteNote(note.id)}
                onEdit={() => handleEditNote(note)}
              />
            ))}
          </div>
        </main>
      )}
      {/* <footer className="app-footer">
        <label className="btn-secondary" onClick={handleExport}>
          Export
        </label>
        <label className="btn-secondary file-input-label">
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </label>
      </footer> */}
      {/* Spotlight Overlay */}
      {isSpotlightOpen && (
        <div className="spotlight-overlay" onClick={handleCloseSpotlight}>
          <div
            className="spotlight-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="spotlight-search">
              <SearchBar
                ref={searchBarRef}
                query={query}
                onQueryChange={handleSpotlightQueryChange}
                isSpotlightMode={true}
                autoFocus={true}
              />
            </div>
          </div>

          <div
            className="spotlight-container"
            onClick={(e) => e.stopPropagation()}
          >
            {query && (
              <div className="spotlight-results">
                <div className="spotlight-results-header">
                  {filteredNotes.length} results
                </div>
                <div className="spotlight-notes-list">
                  {filteredNotes.slice(0, MAX_SPOTLIGHT_RESULTS).map((note) => (
                    <div
                      key={note.id}
                      className="spotlight-note-item"
                      onClick={() => {
                        // You can implement note selection logic here
                        handleCloseSpotlight();
                      }}
                    >
                      <div className="spotlight-note-text">
                        {note.text.length > MAX_NOTE_PREVIEW_LENGTH
                          ? note.text.substring(0, MAX_NOTE_PREVIEW_LENGTH) +
                            "..."
                          : note.text}
                      </div>
                      {note.tags.length > 0 && (
                        <div className="spotlight-note-tags">
                          {note.tags.map((tag) => (
                            <span key={tag} className="spotlight-tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
