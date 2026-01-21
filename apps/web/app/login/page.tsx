'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Zap, Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = `${API_URL}/api/auth/strava`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <Zap className="h-8 w-8 text-blue-600" />
        <span className="text-2xl font-bold text-foreground">AdaptiveRunning</span>
      </div>

      <p className="mb-8 text-center text-muted-foreground">
        Connect your Strava account to get started
      </p>

      {/* Login Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in with your Strava account to access your personalized training recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>

        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-[#FC4C02] hover:bg-[#E34402]"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Connect with Strava
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By connecting, you agree to share your running data with AdaptiveRunning
        </p>
        </CardContent>
      </Card>

      {/* Back to Home Link */}
      <Link
        href="/"
        className="mt-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
