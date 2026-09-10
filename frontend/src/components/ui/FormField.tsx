import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
  className?: string;
}

/**
 * Renders a labeled control with help/error text wired via aria-describedby.
 * The control is passed a generated id to use for its own `id` attribute.
 */
export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children(id)}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-400 dark:text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}