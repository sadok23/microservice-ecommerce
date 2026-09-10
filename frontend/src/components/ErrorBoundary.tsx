import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render errors anywhere below it and shows a recoverable fallback
 * instead of blanking the whole app.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-orange-400 text-3xl">
              😵
            </div>
            <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              Something went wrong
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              An unexpected error occurred. Reload the page to try again.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}