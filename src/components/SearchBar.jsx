import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";

const SearchBar = forwardRef(function SearchBar(
  { query, onQueryChange, onFocus, isSpotlightMode = false, autoFocus = false },
  ref
) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
  }));

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure the overlay is fully rendered
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [autoFocus]);

  return (
    <div
      className={`search-bar ${isSpotlightMode ? "search-bar-spotlight" : ""}`}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onFocus}
        placeholder={
          isSpotlightMode
            ? "Search notes..."
            : "find #tag /todo !urgent or type keywords..."
        }
        className={`search-input ${
          isSpotlightMode ? "search-input-spotlight" : ""
        }`}
      />
    </div>
  );
});

export default SearchBar;
