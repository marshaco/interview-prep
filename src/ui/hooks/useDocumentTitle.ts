import { useEffect } from 'react';

/** Sets the tab title to `Triecode — {page}`, or plain `Triecode` if page is omitted. */
export function useDocumentTitle(page?: string): void {
  useEffect(() => {
    document.title = page ? `Triecode — ${page}` : 'Triecode';
  }, [page]);
}
