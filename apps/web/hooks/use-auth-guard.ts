import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { isAuthenticated } from "@/lib/auth";

/**
 * Custom hook to guard routes that require authentication
 * Redirects to login page if user is not authenticated
 */
export const useAuthGuard = (): void => {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);
};
