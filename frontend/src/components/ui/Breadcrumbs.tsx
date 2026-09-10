import { Fragment } from 'react';
import { Link } from 'react-router';

interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && (
                <span aria-hidden className="text-gray-300 dark:text-gray-600">/</span>
              )}
              <li>
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="transition hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}