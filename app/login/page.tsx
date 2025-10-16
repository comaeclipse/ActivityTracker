"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { generateRandomUsername, generateRandomPassword } from '@/lib/generators';
import { Shuffle, Eye, EyeOff, LogIn, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGenerateUsername = () => {
    setUsername(generateRandomUsername());
  };

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(data.message);

      // Store user in auth context
      login(data.user);

      // Redirect to dashboard after successful login/registration
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to FitLog</h1>
          <p className="text-muted-foreground">Track your fitness journey anonymously</p>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 min-h-[520px]">
          {/* Toggle Login/Signup */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                isLogin
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                !isLogin
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  type="text"
                  placeholder="QuickTiger89"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerateUsername}
                  className="px-3"
                  title="Generate random username"
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground mt-1">
                  Click the shuffle icon to generate a random username
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {!isLogin && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGeneratePassword}
                    className="px-3"
                    title="Generate random password"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground mt-1">
                  Use a strong password or generate a random one
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your activity data is tracked anonymously. We don't collect personal information.
          </p>
        </div>
      </div>

      <SpeedInsights />
    </div>
  );
}
