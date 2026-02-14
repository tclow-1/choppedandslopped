import { useEffect } from 'react';

type KeyHandlers = Record<string, () => void>;

export function useKeyboardShortcuts(handlers: KeyHandlers, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts when focused on text input elements
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Map key to handler
      const handler = handlers[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, enabled]);
}
