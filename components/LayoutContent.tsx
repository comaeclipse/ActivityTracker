"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home, TrendingUp, Calendar, Award, Users, Settings, Activity, Mail, Menu, LogOut, User, X, Shield, Sun, Moon } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { useTheme } from '@/lib/theme-context';
import { getUserGradient } from '@/lib/utils';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicRoutes = ['/login', '/'];

  useEffect(() => {
    if (!isLoading && !user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/login' || (pathname === '/' && !user)) {
    if (pathname === '/') {
      return (
        <div className="min-h-screen">
          <header className="bg-card shadow-sm border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-2">
                <Activity className="text-secondary w-6 h-6" />
                <span className="text-xl font-semibold text-foreground">FitLog</span>
              </div>
              <Link
                href="/login"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-95 transition-opacity"
              >
                Login
              </Link>
            </div>
          </header>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      );
    }
    return <>{children}</>;
  }

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navLink = (href: string, label: string, Icon: React.ElementType, active: boolean, onClick?: () => void) => (
    <Link
      href={href as any}
      onClick={onClick}
      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
        active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </Link>
  );

  const sidebarNav = (onClick?: () => void) => (
    <>
      {navLink('/', 'Dashboard', Home, pathname === '/', onClick)}
      {navLink('/profile', 'Profile', User, pathname === '/profile', onClick)}
      {navLink('/analytics', 'Analytics', TrendingUp, pathname === '/analytics', onClick)}
      {navLink('/profile/calendar', 'Calendar', Calendar, pathname === '/profile/calendar', onClick)}
      {navLink('/goals', 'Goals', Award, pathname === '/goals', onClick)}
      {navLink('/community', 'Community', Users, pathname === '/community', onClick)}
      {navLink('/settings', 'Settings', Settings, pathname === '/settings', onClick)}
      {user.role === 'AUDITOR' &&
        navLink('/auditor', 'Auditor', Shield, pathname.startsWith('/auditor'), onClick)}
    </>
  );

  const userFooter = (onClick?: () => void) => (
    <div className="flex items-center justify-between">
      <Link
        href="/profile"
        onClick={onClick}
        className="flex items-center flex-1 min-w-0 rounded-md hover:bg-muted transition-colors p-1 -m-1"
        aria-label="View profile"
      >
        <div className={`w-10 h-10 rounded-full ${getUserGradient(user.username)} mr-3 flex-shrink-0`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
          <p className="text-xs text-muted-foreground">{user.role === 'AUDITOR' ? 'Auditor' : 'Member'}</p>
        </div>
      </Link>
      <button
        onClick={handleLogout}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  const pageTitle =
    pathname === '/profile' ? 'Profile' :
    pathname === '/analytics' ? 'Analytics' :
    pathname === '/community' ? 'Community' :
    pathname === '/goals' ? 'Goals' :
    pathname === '/settings' ? 'Settings' :
    pathname.startsWith('/auditor') ? 'Auditor' :
    'Dashboard';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card shadow-md hidden md:flex flex-col border-r border-border sticky top-0 h-screen">
        <div className="flex items-center justify-center h-16 px-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Activity className="text-secondary w-6 h-6" />
            <span className="text-xl font-semibold text-foreground">FitLog</span>
          </div>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {sidebarNav()}
        </nav>
        <div className="p-4 border-t border-border">
          {userFooter()}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="bg-card shadow-sm md:hidden border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-2">
              <Activity className="text-secondary w-5 h-5" />
              <span className="text-lg font-semibold text-foreground">FitLog</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-64 bg-card shadow-xl flex flex-col">
              <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <Activity className="text-secondary w-6 h-6" />
                  <span className="text-xl font-semibold text-foreground">FitLog</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {sidebarNav(() => setIsMobileMenuOpen(false))}
              </nav>
              <div className="p-4 border-t border-border">
                {userFooter(() => setIsMobileMenuOpen(false))}
              </div>
            </div>
          </div>
        )}

        {/* Desktop header */}
        <header className="bg-card shadow-sm hidden md:block border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="h-8 w-px bg-border" />
              <Link
                href="/profile"
                className="flex items-center rounded-md hover:bg-muted transition-colors p-1 -m-1"
                aria-label="View profile"
              >
                <div className={`w-8 h-8 rounded-full ${getUserGradient(user.username)} mr-2`} />
                <span className="text-sm font-medium text-foreground">{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
