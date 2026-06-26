import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  HiOutlineViewGrid, HiOutlinePlusCircle, HiOutlineClock, HiOutlineChartSquareBar,
  HiOutlineDocumentText, HiOutlineCog, HiOutlineLogout, HiOutlineMenu, HiOutlineX,
  HiOutlineSun, HiOutlineMoon
} from 'react-icons/hi';

const navItems = [
  { path: '/dashboard', icon: HiOutlineViewGrid, key: 'dashboard' },
  { path: '/add-record', icon: HiOutlinePlusCircle, key: 'addRecord' },
  { path: '/history', icon: HiOutlineClock, key: 'history' },
  { path: '/monthly-report', icon: HiOutlineDocumentText, key: 'monthlyReport' },
  { path: '/analytics', icon: HiOutlineChartSquareBar, key: 'analytics' },
  { path: '/settings', icon: HiOutlineCog, key: 'settings' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">₹</span>
              </div>
              <div>
                <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{t('appName')}</h1>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user?.shopName}</p>
              </div>
            </div>
            <button className="lg:hidden p-1 rounded-lg" onClick={() => setSidebarOpen(false)} style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{t(item.key)}</span>
              </NavLink>
            ))}
          </nav>

          {/* User info & logout */}
          <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{user?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <HiOutlineLogout className="w-5 h-5" />
              <span>{t('logout')}</span>
            </button>
          </div>

          {/* Developed By */}
          <div className="px-4 pb-4 text-center">
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Developed By <span className="font-bold text-primary-500">Gaurav Veer</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 no-print"
          style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <button className="lg:hidden p-2 rounded-xl" onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-secondary)' }}>
            <HiOutlineMenu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl transition-colors"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {darkMode ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
