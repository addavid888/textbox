export function setupHotkeys(handlers) {
  const handleKeyDown = (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl && e.key === "Enter") {
      // Don't prevent default here as it's handled by individual components
      handlers.onSave?.();
    } else if (cmdOrCtrl && e.key === "k") {
      e.preventDefault();
      handlers.onFocusSearch?.();
    } else if (e.key === "Escape") {
      handlers.onEscape?.();
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}
