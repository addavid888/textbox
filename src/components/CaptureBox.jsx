import { useState, useRef, useEffect } from "react";
import { setItem, getItem } from "../utils/localStorage";
import {
  SAVE_KEY,
  UNSAVED_NOTE_KEY,
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  TAG_SELECTOR_MAX_ITEMS,
  TOAST_PREVIEW_MAX_LENGTH,
} from "../constants/keys";

export default function CaptureBox({
  onSave,
  notes = [],
  onShowToast,
  editingNote = null,
  onCancelEdit,
}) {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const [text, setText] = useState("");
  const [isRestoredDraft, setIsRestoredDraft] = useState(false);
  const [settings, setSettings] = useState(() => {
    return getItem(SETTINGS_KEY) || DEFAULT_SETTINGS;
  });
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [tagSelectorPosition, setTagSelectorPosition] = useState({
    top: 0,
    left: 0,
  });
  const [currentTagInput, setCurrentTagInput] = useState("");
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  const textareaRef = useRef(null);

  // Load editing note or restore draft from localStorage on mount
  useEffect(() => {
    if (editingNote) {
      // Load existing note for editing
      setText(editingNote.text);
      setIsRestoredDraft(false);
    } else {
      // Restore unsaved draft
      const savedText = getItem(UNSAVED_NOTE_KEY);
      if (savedText && typeof savedText === "string" && savedText.trim()) {
        setText(savedText);
        setIsRestoredDraft(true);
      }
    }

    const savedSettings = getItem(SETTINGS_KEY);
    if (savedSettings && typeof savedSettings === "object") {
      setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
    }

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingNote]);

  // Apply settings to textarea when settings change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.fontFamily = settings.fontFamily;
      textareaRef.current.style.fontSize = `${settings.fontSize}px`;
    }
  }, [settings]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    setItem(SETTINGS_KEY, settings);
  }, [settings]);

  // Save text to localStorage whenever it changes (only for new notes)
  useEffect(() => {
    if (!editingNote) {
      if (text.trim()) {
        setItem(UNSAVED_NOTE_KEY, text);
      } else {
        // Remove from localStorage if text is empty
        try {
          localStorage.removeItem(UNSAVED_NOTE_KEY);
        } catch (error) {
          console.error(
            "Failed to remove unsaved note from localStorage:",
            error
          );
        }
      }
    }
  }, [text, editingNote]);

  const handleKeyDown = (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Handle tag selector navigation
    if (showTagSelector) {
      const existingTags = getExistingTags();
      const filteredTags = existingTags.filter((tag) =>
        tag.toLowerCase().includes(currentTagInput.toLowerCase())
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedTagIndex((prev) =>
          prev < filteredTags.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedTagIndex((prev) =>
          prev > 0 ? prev - 1 : filteredTags.length - 1
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredTags[selectedTagIndex]) {
          insertTag(filteredTags[selectedTagIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowTagSelector(false);
      }
      return;
    }

    if (cmdOrCtrl && e.key === SAVE_KEY) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape" && editingNote) {
      e.preventDefault();
      handleClearDraft();
    } else if (e.key === "#") {
      // Show tag selector when # is pressed
      setTimeout(() => {
        const position = getCursorPosition();
        setTagSelectorPosition(position);
        setShowTagSelector(true);
        setCurrentTagInput("");
        setSelectedTagIndex(0);
      }, 0);
    }
  };

  const handleSave = () => {
    if (text.trim()) {
      const noteText = text.trim();
      onSave(noteText);

      // Show success toast with appropriate message
      const preview =
        noteText.length > TOAST_PREVIEW_MAX_LENGTH
          ? noteText.substring(0, TOAST_PREVIEW_MAX_LENGTH) + "..."
          : noteText;
      if (onShowToast) {
        onShowToast({
          message: editingNote
            ? `Note updated: "${preview}"`
            : `Note saved: "${preview}"`,
          type: "success",
        });
      }

      if (!editingNote) {
        setText("");
        // Clear the draft from localStorage after successful save (only for new notes)
        try {
          localStorage.removeItem(UNSAVED_NOTE_KEY);
        } catch (error) {
          console.error(
            "Failed to clear unsaved note from localStorage:",
            error
          );
        }
      } else {
        // If editing, just clear the text (the parent handles updating)
        if (onCancelEdit) onCancelEdit();
        setText("");
      }

      setIsRestoredDraft(false);
      setShowTagSelector(false);
    }
  };

  const insertTag = (tag) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBefore = text.substring(0, cursorPos);
    const textAfter = text.substring(cursorPos);

    // Find the # position
    const hashIndex = textBefore.lastIndexOf("#");
    if (hashIndex !== -1) {
      const newText =
        textBefore.substring(0, hashIndex) + "#" + tag + " " + textAfter;
      setText(newText);

      // Set cursor position after the inserted tag
      setTimeout(() => {
        const newCursorPos = hashIndex + tag.length + 2; // +2 for # and space
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }

    setShowTagSelector(false);
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    // Check if we're typing after #
    if (showTagSelector) {
      const cursorPos = e.target.selectionStart;
      const textBefore = newText.substring(0, cursorPos);
      const hashIndex = textBefore.lastIndexOf("#");

      if (hashIndex !== -1) {
        const tagInput = textBefore.substring(hashIndex + 1);
        if (!tagInput.includes(" ")) {
          setCurrentTagInput(tagInput);
          setSelectedTagIndex(0);
        } else {
          setShowTagSelector(false);
        }
      } else {
        setShowTagSelector(false);
      }
    }
  };

  const handleClearDraft = () => {
    if (editingNote && onCancelEdit) {
      setText(""); // Clear text when canceling edit mode
      onCancelEdit();
    } else {
      setText("");
      setIsRestoredDraft(false);
      try {
        localStorage.removeItem(UNSAVED_NOTE_KEY);
      } catch (error) {
        console.error("Failed to clear draft from localStorage:", error);
      }
    }
    setShowTagSelector(false);
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Get unique tags from existing notes
  const getExistingTags = () => {
    const allTags = notes.flatMap((note) => note.tags || []);
    return [...new Set(allTags)].sort();
  };

  // Get cursor position for tag selector positioning
  const getCursorPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);

    // Simple positioning - place below cursor
    const lineHeight = parseInt(style.lineHeight) || 20;
    const lines = textarea.value
      .substring(0, textarea.selectionStart)
      .split("\n").length;

    return {
      top: rect.top + lines * lineHeight + 15,
      // left: rect.left + 10,
    };
  };

  // const isDisabled = !text.trim();

  return (
    <div className="capture-box">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder="Capture your thoughts... Use #tags /commands !priority"
        className="capture-textarea"
        rows={4}
      />

      {/* Tag Selector Tooltip */}
      {showTagSelector && (
        <div
          className="tag-selector"
          style={{
            position: "fixed",
            top: tagSelectorPosition.top,
            left: tagSelectorPosition.left,
            zIndex: 1000,
          }}
        >
          <div className="tag-selector-header">Select a tag</div>
          <div className="tag-selector-list">
            {getExistingTags()
              .filter((tag) =>
                tag.toLowerCase().includes(currentTagInput.toLowerCase())
              )
              .slice(0, TAG_SELECTOR_MAX_ITEMS)
              .map((tag, index) => (
                <div
                  key={tag}
                  className={`tag-selector-item ${
                    index === selectedTagIndex ? "selected" : ""
                  }`}
                  onClick={() => insertTag(tag)}
                >
                  #{tag}
                </div>
              ))}
            {getExistingTags().filter((tag) =>
              tag.toLowerCase().includes(currentTagInput.toLowerCase())
            ).length === 0 && (
              <div className="tag-selector-item disabled">
                Create new tag "{currentTagInput}"
              </div>
            )}
          </div>
        </div>
      )}

      <div className="capture-hint">

      {isRestoredDraft && (
         <div className="draft-indicator">Restored unsaved draft</div>
    )}
        <div className="capture-hint-left">
          <span>
            <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>{" "}
            <kbd>{SAVE_KEY.toUpperCase()}</kbd> to{" "}
            {editingNote ? "update" : "save"}
          </span>
          {editingNote ? (
            <span>
              <kbd>Esc</kbd> to cancel editing
            </span>
          ) : (
            <span>
              <kbd>{isMac ? "⌘" : "Ctrl"}</kbd> <kbd>K</kbd> to search
            </span>
          )}
        </div>

        <div className="settings-controls">
          <select
            value={settings.fontFamily}
            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
            className="font-selector"
          >
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
          <select
            value={settings.fontSize}
            onChange={(e) =>
              updateSettings({ fontSize: parseInt(e.target.value) })
            }
            className="font-size-selector"
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
          </select>
        </div>

        {/* <div className="capture-actions">
          {text.trim() && (
            <label onClick={handleClearDraft} className="btn-secondary">
              Clear
            </label>
          )}
          <button onClick={handleSave} disabled={isDisabled} className="btn">
            Save
          </button>
        </div> */}
      </div>
    </div>
  );
}
