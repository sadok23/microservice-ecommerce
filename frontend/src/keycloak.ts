import Keycloak from 'keycloak-js';
import { env } from '@/lib/env';

const keycloak = new Keycloak({
  url: env.keycloakUrl,
  realm: env.keycloakRealm,
  clientId: env.keycloakClientId,
});

// React 19 StrictMode double-invokes effects in dev, and keycloak-js can only be
// initialized once. Cache the init promise so repeated calls don't re-init.
let initPromise: Promise<boolean> | null = null;

export function initKeycloak(): Promise<boolean> {
  if (!initPromise) {
    initPromise = keycloak.init({ onLoad: 'check-sso', pkceMethod: 'S256' });
  }
  return initPromise;
}

export default keycloak;