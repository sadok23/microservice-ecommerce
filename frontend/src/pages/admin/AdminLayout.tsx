import { NavLink, Outlet } from 'react-router';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/stock', label: 'Stock' },
  { to: '/admin/orders', label: 'Orders' },
];

/**
 * Admin shell: left sidebar (tabs on mobile) + routed content.
 * Uses NavLink so the active tab is highlighted with the brand gradient.
 */
export default function AdminLayout() {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav aria-label="Admin" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-sm shadow-violet-500/30'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}