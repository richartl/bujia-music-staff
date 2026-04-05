const CATALOG_ADMIN_ROLES = new Set(['ADMIN', 'OWNER']);

export function canAccessCatalogs(role?: string | null) {
  if (!role) return false;
  return CATALOG_ADMIN_ROLES.has(role.toUpperCase());
}
