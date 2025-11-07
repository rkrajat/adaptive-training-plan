"use client";

import type { User } from "@adaptive-training-plan/types";
import { Zap, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logout } from "../lib/auth";

interface NavigationProps {
  user?: User;
}

export const Navigation = ({ user }: NavigationProps) => {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <span className="text-lg sm:text-xl font-semibold text-gray-900">
            AdaptiveRunning
          </span>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-3">
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

          {user && (
            <div className="sm:hidden">
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
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-xs sm:text-sm"
          >
            <LogOut className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
