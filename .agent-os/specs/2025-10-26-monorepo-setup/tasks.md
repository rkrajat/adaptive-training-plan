# Spec Tasks

## Tasks

- [x] 1. Initialize Root Monorepo Configuration
  - [x] 1.1 Create root `package.json` with workspace configuration and Turborepo scripts
  - [x] 1.2 Create `pnpm-workspace.yaml` defining apps and packages workspaces
  - [x] 1.3 Create `turbo.json` with build, dev, lint, and typecheck pipeline configurations
  - [x] 1.4 Create root `.gitignore` for node_modules, dist, .next, .turbo
  - [x] 1.5 Install Turborepo and root-level dependencies (`pnpm install turbo typescript @types/node -D`)
  - [x] 1.6 Verify `pnpm install` runs successfully without errors

- [x] 2. Create Shared TypeScript Configuration Package
  - [x] 2.1 Create `packages/typescript-config/` directory structure
  - [x] 2.2 Create `packages/typescript-config/package.json` with package name `@adaptive-training-plan/typescript-config`
  - [x] 2.3 Create `packages/typescript-config/base.json` with strict mode and common compiler options
  - [x] 2.4 Create `packages/typescript-config/nextjs.json` extending base.json with Next.js settings
  - [x] 2.5 Create `packages/typescript-config/node.json` extending base.json with Node.js settings
  - [x] 2.6 Run `pnpm install` to link the new package in workspace

- [x] 3. Create Shared ESLint Configuration Package
  - [x] 3.1 Create `packages/eslint-config/` directory structure
  - [x] 3.2 Create `packages/eslint-config/package.json` with package name `@adaptive-training-plan/eslint-config`
  - [x] 3.3 Install ESLint dependencies in eslint-config package (`eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`)
  - [x] 3.4 Create `packages/eslint-config/index.js` with base TypeScript linting rules (no-any, no-var, import order)
  - [x] 3.5 Create `packages/eslint-config/nextjs.js` extending index.js with Next.js-specific rules
  - [x] 3.6 Create `packages/eslint-config/node.js` extending index.js with Node.js-specific rules
  - [x] 3.7 Run `pnpm install` to link the new package and install dependencies

- [x] 4. Create Next.js Frontend Application (apps/web)
  - [x] 4.1 Create `apps/web/` directory and initialize Next.js with `pnpm create next-app@latest` (App Router, TypeScript, ESLint)
  - [x] 4.2 Configure `apps/web/package.json` with name `web` and add shared config dependencies
  - [x] 4.3 Create `apps/web/tsconfig.json` extending `@adaptive-training-plan/typescript-config/nextjs.json`
  - [x] 4.4 Create `apps/web/.eslintrc.js` extending `@adaptive-training-plan/eslint-config/nextjs`
  - [x] 4.5 Create initial `apps/web/app/page.tsx` with Adaptive Training Plan welcome page
  - [x] 4.6 Create `apps/web/app/layout.tsx` with basic HTML structure
  - [x] 4.7 Run `pnpm install` in apps/web to install dependencies
  - [ ] 4.8 Test `pnpm dev` in apps/web - verify Next.js runs on http://localhost:3000

- [x] 5. Create Express.js Backend Application (apps/api)
  - [x] 5.1 Create `apps/api/` directory structure with `src/` folder
  - [x] 5.2 Create `apps/api/package.json` with name `api` and required dependencies (express, cors, tsx)
  - [x] 5.3 Add shared config dependencies (`@adaptive-training-plan/typescript-config`, `@adaptive-training-plan/eslint-config`)
  - [x] 5.4 Create `apps/api/tsconfig.json` extending `@adaptive-training-plan/typescript-config/node.json`
  - [x] 5.5 Create `apps/api/.eslintrc.js` extending `@adaptive-training-plan/eslint-config/node`
  - [x] 5.6 Create `apps/api/src/index.ts` with Express server and /health endpoint
  - [x] 5.7 Run `pnpm install` in apps/api to install dependencies
  - [ ] 5.8 Test `pnpm dev` in apps/api - verify Express runs on http://localhost:4000

- [ ] 6. Integration Testing and Documentation
  - [ ] 6.1 Run `pnpm install` at root to ensure all workspace packages are linked
  - [ ] 6.2 Test `pnpm dev` at root - verify both web and api start simultaneously
  - [ ] 6.3 Test `turbo build` - verify both applications build successfully with caching output
  - [ ] 6.4 Test `turbo lint` - verify ESLint runs across all packages without errors
  - [ ] 6.5 Test `turbo typecheck` - verify TypeScript compilation succeeds for all packages
  - [ ] 6.6 Create root `README.md` with project overview, getting started, structure, and commands
  - [ ] 6.7 Verify web app serves at http://localhost:3000 and api /health endpoint responds at http://localhost:4000/health
  - [ ] 6.8 Verify all deliverables from spec.md are met
