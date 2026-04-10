import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../config/rbacConfig';

/**
 * ProtectedRoute Component
 * 
 * Enforces role-based access control at the route level
 * 
 * Props:
 *  - children: Component to render if authorized
 *  - permission: Required permission (e.g., 'dashboard', 'add-visit')
 *  - allowedRoles: Array of roles that can access (optional, uses permission if not provided)
 */
export default function ProtectedRoute({ 
  children, 
  permission = null,
  allowedRoles = null 
}) {
  const { user, profile, loading } = useAuth();

  // Still loading auth state
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User has no profile data yet
  if (!profile) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles) {
    // Legacy: check against allowed roles array
    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  } else if (permission) {
    // Check against permission from RBAC config
    if (!hasPermission(profile.role, permission)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
