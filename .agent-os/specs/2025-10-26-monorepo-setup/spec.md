# Spec Requirements Document

> Spec: Monorepo Setup
> Created: 2025-10-26

## Overview

Initialize a production-ready Turborepo monorepo structure with separate apps for frontend (Next.js) and backend (Express.js), configured with pnpm workspaces, shared TypeScript/ESLint configurations, and optimized build pipelines. This foundation will enable efficient code sharing, consistent tooling, and scalable development across the Adaptive Training Plan platform.

## User Stories

### Developer Onboarding

As a developer joining the Adaptive Training Plan project, I want a well-structured monorepo with clear separation between frontend and backend, so that I can quickly understand the codebase architecture and start contributing without confusion.

The developer clones the repository, runs `pnpm install`, and sees a clear `apps/` directory containing `web` (Next.js) and `api` (Express.js) applications, along with a `packages/` directory for shared code. They can run `pnpm dev` to start both applications simultaneously and see them working together.

### Building and Deploying Applications

As a developer, I want to build and deploy individual applications independently, so that frontend changes don't require rebuilding the backend and vice versa, improving deployment speed and reliability.

Using Turborepo's task pipeline, the developer runs `turbo build --filter=web` to build only the frontend application with intelligent caching. Turborepo automatically builds dependent packages first, ensuring the correct build order. Subsequent builds leverage cached results for unchanged packages, significantly reducing build times.

### Maintaining Code Quality Standards

We want shared TypeScript and ESLint configurations across all packages, so that code quality standards are consistent throughout the monorepo and we avoid configuration drift.

All packages and applications extend base TypeScript and ESLint configurations from shared packages (`@adaptive-training-plan/typescript-config` and `@adaptive-training-plan/eslint-config`). When a developer adds a new package, they simply reference these shared configs, ensuring immediate compliance with team standards without duplicating configuration files.

## Spec Scope

1. **Turborepo Initialization** - Set up Turborepo with root `turbo.json` defining build, dev, lint, and typecheck pipelines with appropriate caching strategies.

2. **pnpm Workspace Configuration** - Create `pnpm-workspace.yaml` to manage monorepo packages and configure workspace dependencies for internal package linking.

3. **Directory Structure** - Establish `apps/` directory containing `web` (Next.js) and `api` (Express.js) skeleton applications, and `packages/` directory for shared code.

4. **Shared TypeScript Configuration** - Create `@adaptive-training-plan/typescript-config` package with base `tsconfig.json` files for apps and packages, enforcing strict mode and consistent compiler settings.

5. **Shared ESLint Configuration** - Create `@adaptive-training-plan/eslint-config` package with unified linting rules for TypeScript, React, and Node.js code, including import ordering and code style enforcement.

## Out of Scope

- Database configuration or MongoDB connection setup
- Authentication or API route implementation
- UI components or design system implementation
- CI/CD pipeline configuration (GitHub Actions)
- Deployment configuration for Vercel or Render
- Environment variable management
- Testing framework setup

## Expected Deliverable

1. Running `pnpm install` at the root successfully installs all dependencies and links internal packages.

2. Running `pnpm dev` starts both Next.js frontend (http://localhost:3000) and Express.js backend (http://localhost:4000) with hot reload enabled.

3. Running `turbo build` successfully builds all applications and packages in the correct dependency order with visible caching output.

4. Running `turbo lint` and `turbo typecheck` successfully validates code quality and TypeScript types across all packages without errors.

5. The monorepo contains a clear README.md at the root explaining the structure, available commands, and how to add new packages.
