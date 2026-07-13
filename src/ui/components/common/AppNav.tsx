import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Roadmap', end: true },
  { to: '/dashboard', label: 'Dashboard', end: false },
  { to: '/review', label: 'Review', end: false },
];

export function AppNav() {
  return (
    <nav className="flex items-center gap-4 border-b border-border bg-bg-inset px-4 py-2 text-sm">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => (isActive ? 'font-medium text-accent' : 'text-text-muted hover:text-accent')}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
