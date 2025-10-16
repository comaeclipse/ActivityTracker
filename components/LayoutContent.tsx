"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, TrendingUp, Calendar, Award, Users, Settings, Activity, Bell, Mail, Menu, LogOut, User, X } from 'lucide-react';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/'];

  useEffect(() => {
    if (!isLoading && !user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);

  // Check loading state FIRST to prevent layout shifts
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

  // If on login page or index page without user, just render the children without dashboard UI
  if (pathname === '/login' || (pathname === '/' && !user)) {
    if (pathname === '/') {
      // Simple header for public homepage
      return (
        <div className="min-h-screen">
          <header className="bg-card shadow-sm border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-2">
                <Activity className="text-secondary w-6 h-6" />
                <span className="text-xl font-semibold text-foreground">FitLog</span>
              </div>
              <a
                href="/login"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-95 transition-opacity"
              >
                Login
              </a>
            </div>
          </header>
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      );
    }
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card shadow-md hidden md:block border-r border-border">
        <div className="flex items-center justify-center h-16 px-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Activity className="text-secondary w-6 h-6" />
            <span className="text-xl font-semibold text-foreground">FitLog</span>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <a
            href="/"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              pathname === '/'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Home className="w-5 h-5 mr-3" />
            Dashboard
          </a>
          <a
            href="/profile"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              pathname === '/profile'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <User className="w-5 h-5 mr-3" />
            Profile
          </a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <TrendingUp className="w-5 h-5 mr-3" />
            Analytics
          </a>
          <a href="/profile/calendar" className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <Calendar className="w-5 h-5 mr-3" />
            Calendar
          </a>
          <a href="/goals" className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <Award className="w-5 h-5 mr-3" />
            Goals
          </a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Community
          </a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </a>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <a
              href="/profile"
              className="flex items-center flex-1 min-w-0 rounded-md hover:bg-muted transition-colors p-1 -m-1"
              aria-label="View profile"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground">Member</p>
              </div>
            </a>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu panel */}
            <div className="absolute inset-y-0 left-0 w-64 bg-card shadow-xl">
              <div className="flex flex-col h-full">
                {/* Header */}
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

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  <a
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      pathname === '/'
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Home className="w-5 h-5 mr-3" />
                    Dashboard
                  </a>
                  <a
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      pathname === '/profile'
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <User className="w-5 h-5 mr-3" />
                    Profile
                  </a>
                  <a
                    href="#"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <TrendingUp className="w-5 h-5 mr-3" />
                    Analytics
                  </a>
                  <a
                    href="/profile/calendar"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    Calendar
                  </a>
                  <a
                    href="/goals"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Award className="w-5 h-5 mr-3" />
                    Goals
                  </a>
                  <a
                    href="#"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Users className="w-5 h-5 mr-3" />
                    Community
                  </a>
                  <a
                    href="#"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    Settings
                  </a>
                </nav>

                {/* User profile footer */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <a
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center flex-1 min-w-0 rounded-md hover:bg-muted transition-colors p-1 -m-1"
                      aria-label="View profile"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary mr-3 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground">Member</p>
                      </div>
                    </a>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop header */}
        <header className="bg-card shadow-sm hidden md:block border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-foreground">
              {pathname === '/profile' ? 'Profile' : 'Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Mail className="w-5 h-5" />
              </button>
              <div className="h-8 w-px bg-border"></div>
            <a
              href="/profile"
              className="flex items-center rounded-md hover:bg-muted transition-colors p-1 -m-1"
              aria-label="View profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary mr-2" />
              <span className="text-sm font-medium text-foreground">{user.username}</span>
            </a>
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

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
