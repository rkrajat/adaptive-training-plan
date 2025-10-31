'use client';

import type { User } from '@adaptive-training-plan/types';
import { Zap, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
              <Avatar>
                <AvatarImage
                  src={user.profilePhoto}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback>
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
          >
            <LogOut className="mr-1 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};
