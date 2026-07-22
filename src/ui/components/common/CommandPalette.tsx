import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { modules, questions } from '../../../content/registry';

interface PaletteEntry {
  id: string;
  label: string;
  hint?: string;
  href: string;
}

function buildEntries(): PaletteEntry[] {
  const staticEntries: PaletteEntry[] = [
    { id: 'nav-roadmap', label: 'Roadmap', href: '/' },
    { id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'nav-review', label: "Today's Review", href: '/review' },
  ];

  const moduleEntries: PaletteEntry[] = modules
    .filter((module) => module.stages.some((stage) => stage.items.length > 0))
    .map((module) => ({
      id: `module-${module.id}`,
      label: module.title,
      hint: 'Module',
      href: `/modules/${module.id}`,
    }));

  const questionEntries: PaletteEntry[] = questions.map((question) => ({
    id: `question-${question.id}`,
    label: question.title,
    hint: modules.find((m) => m.id === question.moduleId)?.title ?? question.moduleId,
    href: `/questions/${question.id}`,
  }));

  return [...staticEntries, ...moduleEntries, ...questionEntries];
}

/**
 * Global ⌘K / Ctrl+K palette. Entries are derived from the content registry
 * rather than hardcoded, so it stays correct as modules/questions are added.
 */
export function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo(() => buildEntries(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 20);
    return entries.filter((e) => e.label.toLowerCase().includes(q) || e.hint?.toLowerCase().includes(q)).slice(0, 20);
  }, [entries, query]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((open) => !open);
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Reset transient state whenever the palette opens/closes, or the query
  // changes — adjusting state during render avoids an extra
  // commit-then-reset pass (see useQuestionPlayer's question-change reset).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    setQuery('');
    setActiveIndex(0);
  }
  const [previousQuery, setPreviousQuery] = useState(query);
  if (query !== previousQuery) {
    setPreviousQuery(query);
    setActiveIndex(0);
  }

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  function activate(entry: PaletteEntry | undefined) {
    if (!entry) return;
    setIsOpen(false);
    void navigate(entry.href);
  }

  const activeId = filtered[activeIndex] ? `command-palette-option-${filtered[activeIndex].id}` : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24 transition-opacity duration-200 ease-out-motion"
      onClick={() => setIsOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-bg-raised shadow-xl"
      >
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls="command-palette-listbox"
          aria-activedescendant={activeId}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              activate(filtered[activeIndex]);
            }
          }}
          placeholder="Jump to a module, question, or page…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none"
        />
        <ul id="command-palette-listbox" role="listbox" className="max-h-80 overflow-y-auto p-1">
          {filtered.length === 0 && <li className="px-3 py-4 text-center text-sm text-text-muted">No matches.</li>}
          {filtered.map((entry, index) => (
            <li
              key={entry.id}
              id={`command-palette-option-${entry.id}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => activate(entry)}
              className={`flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm transition-colors duration-200 ease-out-motion ${
                index === activeIndex ? 'bg-accent-muted text-text' : 'text-text-muted'
              }`}
            >
              <span>{entry.label}</span>
              {entry.hint && <span className="text-xs text-text-muted">{entry.hint}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
