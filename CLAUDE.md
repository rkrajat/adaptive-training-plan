# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Adaptive Training Plan** is an online platform that helps runners intelligently adjust their training plans based on recent performance and health data. It analyzes Strava data (distance, heart rate, sleep) to provide data-driven recommendations to optimize weekly training.

**Current Status**: Project is in planning/setup phase with Agent OS installed. No application code exists yet - only documentation and configuration.

## Architecture

### Monorepo Structure (Planned)

The project will use a **Turborepo monorepo** with the following structure:

```
/apps/
  /web          - Next.js frontend (App Router)
  /api          - Express.js backend API
/packages/
  /ui           - Shared React components (shadcn/ui based)
  /types        - Shared TypeScript type definitions
  /utils        - Helper functions and utilities
  /eslint-config - Shared ESLint configuration
  /typescript-config - Shared TypeScript configuration
```

### Tech Stack

**Frontend**:
- Next.js (App Router) with React
- shadcn/ui for components (primary component library)
- Tailwind CSS for styling (design system)
- Zustand for state management
- TanStack Query for API data fetching

**Backend**:
- Node.js with Express.js
- Zod for schema validation
- MongoDB with Mongoose ODM

**Infrastructure**:
- pnpm for package management (REQUIRED - never use npm/yarn)
- Turborepo for build orchestration and caching
- TypeScript strict mode throughout
- ESLint + Prettier for code quality

**Deployment**:
- Vercel for frontend
- Render for backend (Docker containers)
- MongoDB Atlas for database

## Development Commands

### Package Management
**CRITICAL**: Always use `pnpm`, never `npm` or `yarn`:
```bash
pnpm install              # Install dependencies
pnpm add <package>        # Add production dependency
pnpm add -D <package>     # Add dev dependency
```

### Build and Development (When Implemented)
```bash
pnpm dev                  # Run development servers
pnpm build                # Build all packages
pnpm test                 # Run all tests
pnpm lint                 # Lint all packages
pnpm lint --fix           # Auto-fix linting issues
pnpm typecheck            # Run TypeScript compiler checks
```

### Turborepo Commands (When Implemented)
```bash
turbo build --filter=web  # Build specific app
turbo dev --filter=api    # Run specific app in dev mode
turbo prune --scope=web   # Create minimal subtree for deployment
```

## Agent OS Workflow

This repository uses **Agent OS** for structured development. Key commands:

```bash
# Initial setup (already done)
/plan-product             # Setup Agent OS for new project
/analyze-product          # Install Agent OS in existing codebase

# Feature development cycle
/add-roadmap-item         # Add features to roadmap
/create-spec [feature]    # Create specification for feature
/create-spec all          # Create specs for all planned features
/edit-spec [spec-path]    # Edit existing specification
/create-tasks             # Generate task list from spec
/execute-tasks            # Implement feature tasks
/update-best-practices    # Document learnings after implementation
```

**Workflow Pattern**:
1. Define feature in roadmap
2. Create detailed specification
3. Break down into tasks
4. Execute implementation
5. Document learnings (only if errors occurred)

## Code Standards

### Component Architecture
- **MANDATORY**: Functional components with hooks only (no class components)
- **MANDATORY**: TypeScript strict mode with explicit types
- **FORBIDDEN**: `any` type usage
- **REQUIRED**: Named exports only (no default exports)
- **REQUIRED**: Arrow functions exclusively

### File Organization
```
components/
└── feature-name/
    ├── index.ts              # Named exports
    ├── FeatureName.tsx       # Component
    ├── types.ts              # TypeScript interfaces
    ├── constants.ts          # Constants
    └── FeatureName.test.tsx  # Tests
```

### Naming Conventions
- **Files/Folders**: `kebab-case` (user-profile/)
- **Components/Types**: `PascalCase` (UserProfile, UserProfileProps)
- **Variables/Functions**: `camelCase` (userName, fetchUserData)
- **Constants**: `UPPER_SNAKE_CASE` (MAX_RETRY_COUNT)
- **Hooks**: `camelCase` with `use` prefix (useUserData)

### Design System
1. **FIRST**: Use shadcn/ui components (never create custom UI when shadcn/ui equivalent exists)
2. **SECOND**: Use Tailwind CSS utility classes for styling
3. **THIRD**: Use Tailwind CSS theme configuration and CSS variables
4. **FORBIDDEN**: Inline styles or arbitrary CSS values outside Tailwind

### Data Fetching
- **REQUIRED**: Use TanStack Query for all external API calls
- **REQUIRED**: Create custom hooks for all API operations
- **REQUIRED**: Implement proper error handling and loading states
- **FORBIDDEN**: Direct fetch/axios calls when TanStack Query should be used

### Import Order (ENFORCED by ESLint)
1. React imports
2. External libraries
3. Type imports (using `import type`)
4. Internal imports (alphabetical)
5. Relative imports

Newlines between groups are required.

### TypeScript
- Use TypeScript strict mode
- Explicit types for all props and interfaces
- Use `type` keyword for imports: `import type { User } from './types'`
- No `any` types allowed
- Minimum variable name length: 3 characters (exceptions: id, z, _)

## Key Files

### Documentation
- `docs/PRODUCT.md` - Product brief and feature requirements
- `docs/MONOREPO_TECHNICAL_DESIGN_BLUEPRINT.md` - Architecture overview
- `docs/MONOREPO_STRUCTURE_AND_DEPLOYMENT_WITH_TURBOREPO.md` - Deployment strategy
- `.agent-os/standards/tech-stack.md` - Authoritative tech stack reference
- `.agent-os/standards/best-practices.md` - Development standards and patterns
- `.agent-os/standards/code-style.md` - Code formatting and style rules

### Agent OS
- `.agent-os/instructions/core/` - Agent OS command implementations
- `.agent-os/standards/` - Development standards and patterns
- `.claude/commands/` - Claude Code slash commands
- `.claude/agents/` - Specialized agent configurations

## Important Notes

1. **Package Manager**: ALWAYS use `pnpm` - npm/yarn usage will fail CI
2. **Component Library**: ALWAYS use shadcn/ui components before creating custom ones
3. **Exports**: NEVER use default exports - always use named exports
4. **Functions**: NEVER use function declarations - always use arrow functions
5. **Variables**: NEVER use `var` - use `const` or `let`
6. **Code Style**: Run `pnpm prettier` after adding new `.ts` or `.tsx` files
7. **Standards**: Reference `.agent-os/standards/` files for domain-specific requirements
8. **Type Safety**: All code must pass TypeScript strict mode compilation

## Testing

- Write unit tests for all components
- Use React Testing Library for component tests
- Use MSW (Mock Service Worker) for API mocking
- Create isolated query clients for TanStack Query tests
- Test loading, error, and success states

## External Integrations

- **Strava API**: Primary data source for user running data (past month)
- **MongoDB Atlas**: Cloud-hosted database for user data and training plans

## Target Features (v1)

1. Strava OAuth integration and data import
2. Training plan upload/definition
3. AI-powered weekly training recommendations
4. Recommendation regeneration based on user feedback
5. Week-specific training plan adjustments

**Out of Scope**: Multi-source integrations (Garmin, Fitbit), nutrition recommendations, mobile app
