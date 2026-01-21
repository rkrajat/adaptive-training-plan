# Spec Tasks

Tasks for implementing dark mode support as detailed in @.agent-os/specs/2026-01-21-dark-mode-support/spec.md

## Tasks

- [x] 1. Create ThemeProvider and useTheme hook
  - [x] 1.1 Create theme constants and types (theme values, localStorage key)
  - [x] 1.2 Implement ThemeProvider component with React Context
  - [x] 1.3 Implement useTheme hook exposing theme, setTheme, and systemTheme
  - [x] 1.4 Add localStorage read/write with error handling
  - [x] 1.5 Add system preference detection via matchMedia
  - [x] 1.6 Add real-time listener for OS theme changes

- [x] 2. Create ThemeToggle component
  - [x] 2.1 Create ThemeToggle component with shadcn/ui Button
  - [x] 2.2 Add Sun/Moon icons from lucide-react with conditional rendering
  - [x] 2.3 Add accessibility attributes (aria-label)

- [x] 3. Implement flash prevention script
  - [x] 3.1 Create inline script that reads localStorage and applies theme before hydration
  - [x] 3.2 Add fallback to matchMedia for system preference detection
  - [x] 3.3 Integrate script into app/layout.tsx head section

- [x] 4. Integrate into application
  - [x] 4.1 Wrap application with ThemeProvider in app/layout.tsx
  - [x] 4.2 Add ThemeToggle to header/navigation component
  - [x] 4.3 Add transition-colors class to body for smooth transitions
  - [x] 4.4 Verify existing components render correctly in both themes
