import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActiveAlertCount, subscribeToAlerts } from '../services/alerts';
import { hasPermission } from '../config/rbacConfig';
import {
  LayoutDashboard,
  Users,
  ClipboardPlus,
  Bell,
  Pill,
  TestTube,
  LogOut,
  Menu,
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    getActiveAlertCount().then(setAlertCount).catch(() => {});
    const unsubscribe = subscribeToAlerts(() => {
      getActiveAlertCount().then(setAlertCount).catch(() => {});
    });
    return unsubscribe;
  }, []);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
    { to: '/patients', icon: Users, label: 'Patients', permission: 'patients' },
    { to: '/visits/new', icon: ClipboardPlus, label: 'Add Visit', permission: 'add-visit' },
    { to: '/alerts', icon: Bell, label: 'Alerts', permission: 'alerts', badge: alertCount },
    { to: '/medications', icon: Pill, label: 'Medications', permission: 'medications' },
    { to: '/diagnostics', icon: TestTube, label: 'Diagnostics', permission: 'diagnostics' },
  ];

  const filteredItems = navItems.filter(item => {
    if (!profile?.role) return false;
    return hasPermission(profile.role, item.permission);
  });

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div
        className={`mobile-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Heart size={20} />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <span>Continuum</span>Care
            </div>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => {
              if (mobileOpen) setMobileOpen(false);
              else setCollapsed(!collapsed);
            }}
            style={{ position: 'static', marginLeft: 'auto' }}
          >
            {mobileOpen ? <X size={14} /> : collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {!collapsed && <div className="sidebar-section-label">Navigation</div>}
          {filteredItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="sidebar-link-icon" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge > 0 && (
                <span className="sidebar-link-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={signOut} title="Sign out">
            <div className="sidebar-user-avatar">{initials}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{profile?.full_name || 'User'}</div>
                <div className="sidebar-user-role">{profile?.role || '—'}</div>
              </div>
            )}
            {!collapsed && <LogOut size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
          </div>
        </div>
      </aside>
    </>
  );
}
