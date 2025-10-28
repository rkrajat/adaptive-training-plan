'use client';

import type { User } from '@adaptive-training-plan/types';

import { logout } from '../lib/auth';

interface NavigationProps {
  user: User;
}

export const Navigation = ({ user }: NavigationProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between">
      {/* User Profile Section */}
      <div className="flex items-center gap-3">
        {user.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </p>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="bg-[#FC4C02] hover:bg-[#E04402] text-white font-medium px-4 py-2 rounded transition-colors duration-200"
      >
        Logout
      </button>
    </nav>
  );
};
