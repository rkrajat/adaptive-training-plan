import { Zap, Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

/**
 * Full-page branded loading screen
 */
export const LoadingScreen = ({
  message = "Loading...",
}: LoadingScreenProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-semibold text-foreground">
            AdaptiveRunning
          </span>
        </div>
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
