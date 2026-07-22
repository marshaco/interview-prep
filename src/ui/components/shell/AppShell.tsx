import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/review', label: 'Review', end: false },
];

interface AppShellProps {
  children: ReactNode;
}

/**
 * The persistent-nav shell: wordmark + two destinations, a single centered
 * content column on --color-bg. Used by every "browse/plan" screen (Home,
 * Module). The other shell — FocusShell — is for "do the work" screens
 * (Learn, the editor), where nav recedes to a single back-link.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <nav className="flex items-center gap-8 border-b border-border bg-bg-inset px-6 py-3">
        <NavLink to="/" className="text-sm font-semibold tracking-tight">
          <span className="text-accent">Trie</span>code
        </NavLink>
        <div className="flex gap-5 text-sm">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive ? 'font-medium text-accent' : 'text-text-muted hover:text-text'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-[1100px] px-6 py-10">{children}</main>
    </div>
  );
}
