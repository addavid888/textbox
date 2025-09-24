import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import {
  NOTE_TITLE_MAX_LENGTH,
  NOTE_SNIPPET_MAX_LENGTH,
} from "../constants/keys";

const SAVE_KEY = "s";

export default function NoteItem({ note, onUpdate, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef(null);

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(note.text);
    setShowPopover(false);
  };

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(note.text);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      onDelete();
    }
    setShowPopover(false);
  };

  // Handle clicking outside popover to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPopover]);

  const handleKeyDown = (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl && e.key === SAVE_KEY) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const getTitle = (text) => {
    const firstLine = text.split("\n")[0];
    return firstLine.length > NOTE_TITLE_MAX_LENGTH
      ? firstLine.substring(0, NOTE_TITLE_MAX_LENGTH) + "..."
      : firstLine;
  };

  const getSnippet = (text) => {
    const lines = text.split("\n");
    const secondLine = lines[1] || "";
    return secondLine.length > NOTE_SNIPPET_MAX_LENGTH
      ? secondLine.substring(0, NOTE_SNIPPET_MAX_LENGTH) + "..."
      : secondLine;
  };

  if (isEditing) {
    return (
      <div className="note-item editing">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="note-edit-textarea"
          rows={4}
          autoFocus
        />
        <div className="note-actions">
          <button onClick={handleSave} className="btn-save">
            Save
          </button>
          <button onClick={handleCancel} className="btn-cancel">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const handleNoteClick = () => {
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <div className="note-item">
      <div
        className="note-content"
        onClick={handleNoteClick}
        style={{ cursor: "pointer" }}
      >
        <div className="note-title">{getTitle(note.text)}</div>
        {getSnippet(note.text) && (
          <div className="note-snippet">{getSnippet(note.text)}</div>
        )}
      </div>
      <div
        className="note-actions"
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="note-meta">
          {note.tags.map((tag) => (
            <span key={tag} className="pill pill-tag">
              #{tag}
            </span>
          ))}
          {note.commands.map((command) => (
            <span key={command} className="pill pill-command">
              /{command}
            </span>
          ))}
          {note.priority && (
            <span className="pill pill-priority">!{note.priority}</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPopover(!showPopover);
          }}
          className="btn-more"
          aria-label="More options"
        >
          <MoreHorizontal size={16} />
        </button>
        {showPopover && (
          <div className="note-popover">
            <button
              onClick={() => {
                onEdit && onEdit();
                setShowPopover(false);
              }}
              className="popover-item"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="popover-item popover-item-danger"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
