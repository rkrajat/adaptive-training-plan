'use client';

import type { User } from '@adaptive-training-plan/types';
import { Zap, LogOut } from 'lucide-react';

import { logout } from '../lib/auth';

interface NavigationProps {
  user?: User;
}

export const Navigation = ({ user }: NavigationProps) => {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">AdaptiveRunning</span>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-semibold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
