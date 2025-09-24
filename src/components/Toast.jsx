import { useEffect } from "react";
import { X } from "lucide-react";

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      {message}
      <span onClick={onClose} className="toast-close">
        <X size={20} />
      </span>
    </div>
  );
}
