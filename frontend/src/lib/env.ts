/**
 * Central, typed access to VITE_* environment variables.
 * Falls back to localhost dev defaults so the app boots without .env files.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8090',
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'ecommerce',
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'frontend-client',
} as const;