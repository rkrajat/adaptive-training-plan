# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2026-01-21-dark-mode-support/spec.md

## Technical Requirements

### Theme Provider Implementation

- Create a `ThemeProvider` component using React Context that wraps the application
- Implement `useTheme` hook exposing: `theme` (current theme), `setTheme` (setter function), and `systemTheme` (detected OS preference)
- Support three theme values: `"light"`, `"dark"`, and `"system"` (follows OS preference)
- Theme state changes should add/remove the `dark` class on the `<html>` element (Tailwind's class-based dark mode strategy)

### Theme Toggle Component

- Create a `ThemeToggle` component for the header navigation
- Use shadcn/ui Button component with `variant="ghost"` and `size="icon"`
- Display sun icon (Lucide `Sun`) in dark mode, moon icon (Lucide `Moon`) in light mode
- Include accessible label via `aria-label` attribute
- Clicking toggles between light and dark modes directly (not cycling through system)

### localStorage Persistence

- Storage key: `"adaptive-training-theme"`
- Store the user's explicit preference (`"light"` or `"dark"`) when manually toggled
- On initialization: check localStorage first, fall back to system preference if no stored value
- Use try/catch for localStorage operations to handle private browsing modes

### System Preference Detection

- Use `window.matchMedia("(prefers-color-scheme: dark)")` to detect OS preference
- Add event listener for `change` event to react to OS preference changes in real-time
- Only apply system preference when no explicit user preference is stored

### Flash Prevention (Critical for UX)

- Add inline script in `<head>` (before body renders) that:
  1. Reads localStorage for stored theme
  2. Falls back to `matchMedia` check if no stored theme
  3. Adds `dark` class to `<html>` element immediately if dark mode
- This script must execute synchronously before React hydration to prevent flash of wrong theme
- Implement via Next.js `app/layout.tsx` using a `<script dangerouslySetInnerHTML>` approach

### UI/UX Specifications

- Theme transition: Add `transition-colors` class to body for smooth color transitions (duration ~150ms)
- Toggle button placement: Right side of header navigation, before user menu/avatar if present
- Icon animation: Consider subtle rotation or fade transition when switching icons
- Ensure all existing components respect dark mode (verify CSS variables in globals.css cover all states)

### File Structure

```
apps/web/
├── components/
│   ├── theme-provider.tsx      # ThemeProvider context and useTheme hook
│   └── ui/
│       └── theme-toggle.tsx    # Theme toggle button component
├── app/
│   └── layout.tsx              # Add ThemeProvider wrapper and flash prevention script
└── lib/
    └── theme.ts                # Theme constants and utility functions (optional)
```

### Integration Points

- **Header Component**: Add `<ThemeToggle />` to existing header/navigation component
- **Root Layout**: Wrap application with `<ThemeProvider>` in `app/layout.tsx`
- **globals.css**: Verify dark mode CSS variables are complete (already partially configured)

### Browser Compatibility

- localStorage: Supported in all modern browsers
- matchMedia: Supported in all modern browsers (IE11+ with limitations, but not a target)
- CSS custom properties: Supported in all modern browsers

### Testing Considerations

- Test theme toggle functionality in both modes
- Verify localStorage persistence across page refreshes
- Test system preference detection by changing OS settings
- Verify no flash of wrong theme on page load
- Test in private/incognito mode (localStorage may be restricted)

## External Dependencies

- **lucide-react** - Already installed; provides Sun and Moon icons for the toggle button
