/**
 * RBAC Configuration
 * Centralized role-based permissions for the ContinuumCare application
 */

export const ROLE_PERMISSIONS = {
  doctor: [
    'dashboard',
    'patients',
    'patient-profile',
    'add-visit',
    'alerts',
    'medications',
    'diagnostics',
  ],
  nurse: [
    'dashboard',
    'patients',
    'patient-profile',
    'add-visit',
    'alerts',
    'medications',
    'diagnostics',
  ],
  family: [
    'dashboard',
    'patient-profile',
    'medications',
    'download-report',
  ],
};

/**
 * Check if a role has permission for a specific resource
 * @param {string} role - User role
 * @param {string} permission - Required permission
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions && permissions.includes(permission);
};

/**
 * Get all allowed routes for a given role
 * @param {string} role - User role
 * @returns {string[]}
 */
export const getAllowedRoutes = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user can access a specific route
 * @param {string} role - User role
 * @param {string} routePath - Route path (without leading slash)
 * @returns {boolean}
 */
export const canAccessRoute = (role, routePath) => {
  // Map route paths to permissions
  const routePermissionMap = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/patients': 'patients',
    '/patients/:id': 'patient-profile',
    '/visits/new': 'add-visit',
    '/alerts': 'alerts',
    '/medications': 'medications',
    '/diagnostics': 'diagnostics',
    '/download-report': 'download-report',
  };

  // Find the matching permission for the route
  const permission = routePermissionMap[routePath];
  return permission ? hasPermission(role, permission) : true;
};

/**
 * Check if user can perform a specific action
 * @param {string} role - User role
 * @param {string} action - Action type
 * @returns {boolean}
 */
export const canPerformAction = (role, action) => {
  const actionPermissions = {
    'create-patient': ['doctor', 'nurse'],
    'create-visit': ['doctor', 'nurse'],
    'create-alert': ['system'], // Only system can create alerts
    'edit-prescription': ['doctor'],
    'compare-prices': ['doctor', 'nurse'],
    'view-reports': ['doctor', 'nurse', 'family'],
    'download-report': ['family', 'doctor', 'nurse'],
    'manage-users': ['admin'],
  };

  return actionPermissions[action]?.includes(role) || false;
};
