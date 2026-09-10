import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import keycloak, { initKeycloak } from '../keycloak';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    initKeycloak().then((auth) => {
      setAuthenticated(auth);
      setInitialized(true);
    });
  }, []);

  if (!initialized) {
    return <LoadingSpinner message="Connecting to authentication..." />;
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ShopMicro</h1>
          <p className="mb-8 text-gray-500">Sign in to start shopping</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => keycloak.login()}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => keycloak.register()}
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
