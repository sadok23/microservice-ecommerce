import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICON: Record<ToastType, string> = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️',
};

const TONE: Record<ToastType, string> = {
  success: 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950',
  error: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950',
  info: 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900',
};

const DURATION = 4000;

export function ToastProvider({ children, position = 'top-right' }: { children: ReactNode; position?: 'top-right' }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, type, message }]);
      window.setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m: string) => toast('success', m),
      error: (m: string) => toast('error', m),
      info: (m: string) => toast('info', m),
    }),
    [toast]
  );

  const posClass = position === 'top-right' ? 'top-4 right-4' : 'top-4 left-4';

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className={cn('fixed z-[60] flex w-full max-w-xs flex-col gap-2', posClass)}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'toast-in flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
              TONE[t.type]
            )}
            role="status"
          >
            <span aria-hidden>{ICON[t.type]}</span>
            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}