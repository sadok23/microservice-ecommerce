import keycloak from '../keycloak';

export function isAdmin(): boolean {
  const roles = keycloak.tokenParsed?.realm_access?.roles;
  return Array.isArray(roles) && roles.includes('admin');
}