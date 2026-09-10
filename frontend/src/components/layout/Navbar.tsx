import { useState } from 'react';
import { NavLink } from 'react-router';
import keycloak from '@/keycloak';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { isAdmin } from '@/utils/auth';
import { cn } from '@/lib/cn';

const NAV_LINKS = [
  { to: '/', label: 'Products', end: true },
  { to: '/orders', label: 'My Orders', end: false },
];

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
  );
}

export default function Navbar() {
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const username = keycloak.tokenParsed?.preferred_username ?? 'User';
  const admin = isAdmin();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="gradient-brand-bg flex h-9 w-9 items-center justify-center rounded-xl text-base text-white shadow-sm">
            🛍️
          </span>
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
            ShopMicro
          </span>
        </NavLink>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
          {admin && (
            <NavLink to="/admin" className={navLinkClass}>
              🛠 Admin
            </NavLink>
          )}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <NavLink
            to="/cart"
            className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            aria-label={`Cart, ${totalItems} item${totalItems === 1 ? '' : 's'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-1 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </NavLink>

          {/* User */}
          <div className="hidden items-center gap-3 border-l border-gray-200 pl-3 md:flex dark:border-gray-800">
            <span className="max-w-32 truncate text-sm text-gray-500 dark:text-gray-400">
              {username}
            </span>
            <button
              onClick={() => keycloak.logout()}
              className="text-sm text-gray-400 transition hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
            >
              Sign Out
            </button>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden dark:border-gray-800 dark:bg-gray-950/95"
        >
          <div className="page-container flex flex-col gap-1 py-3">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            {admin && (
              <NavLink to="/admin" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                🛠 Admin
              </NavLink>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">{username}</span>
              <button
                onClick={() => keycloak.logout()}
                className="text-sm font-medium text-red-500 hover:text-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}