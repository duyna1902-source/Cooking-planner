import { useState, useCallback } from 'react';

export function useClipboardCopy(resetDelayMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelayMs);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [resetDelayMs]);

  return { copied, copy };
}
