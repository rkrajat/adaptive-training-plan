"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribe to media query changes
 */
const subscribe = (query: string, callback: () => void): (() => void) => {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

/**
 * Get current snapshot of media query match
 */
const getSnapshot = (query: string): boolean => {
  return window.matchMedia(query).matches;
};

/**
 * Server snapshot always returns false
 */
const getServerSnapshot = (): boolean => false;

/**
 * Hook to detect if a media query matches
 * @param query - CSS media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating if the query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const matches = useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => getSnapshot(query),
    getServerSnapshot
  );

  return matches;
};
