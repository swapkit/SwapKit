import { type ReactNode, useEffect, useRef } from "react";
import { CloseIcon } from "./icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[1000] animate-[fadeIn_0.2s_ease-out]">
      <div
        ref={contentRef}
        className={`bg-dark-200 rounded-2xl max-w-[480px] w-[90%] max-h-[80vh] overflow-hidden shadow-[0px_6px_16px_0px_rgba(0,0,0,0.4)] animate-[slideUp_0.3s_ease-out] ${className || ""}`}
      >
        <button
          type="button"
          className="absolute top-4 right-4 w-8 h-8 rounded-md bg-dark-400 border-0 flex items-center justify-center cursor-pointer transition-colors hover:bg-dark-300"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}
