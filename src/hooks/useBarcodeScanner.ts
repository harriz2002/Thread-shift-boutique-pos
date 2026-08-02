import { useEffect, useRef } from 'react';

export function useGlobalBarcodeScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length > 3) {
          const scannedCode = bufferRef.current;
          bufferRef.current = '';
          onScan(scannedCode);
        }
        bufferRef.current = '';
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // Add character to buffer
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Clear buffer if typing is too slow (human typing vs scanner)
        // Scanners usually type within 10-30ms per character
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 100); // 100ms timeout for next keypress to be safe
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
}
