# Tech Stack (MASTER REFERENCE)

## Context and Usage

This document serves as the **authoritative reference** for all technology decisions within the Adaptive Training Plan monorepo project. All development, tooling, and architectural decisions must align with the technologies and versions specified in this document. This tech stack is designed for a high-performance, scalable monorepo architecture supporting both web and API applications.

---

## 1. Core Framework/Runtime

- **Node.js:** Latest LTS (Runtime environment for JavaScript backend and build tools)
- **TypeScript:** Latest stable (Primary language for type safety and improved code quality)
- **Next.js:** Latest stable with App Router (Frontend framework with SSR/SSG capabilities)
- **React:** Latest stable (Frontend UI library using functional components and hooks)
- **Express.js:** Latest stable (Backend web framework for API services)

## 2. Development Environment

- **pnpm:** Latest stable (Package manager for efficient disk usage and strict dependency management)
- **Turborepo:** Latest stable (Build system and task runner for monorepo orchestration)
- **Node.js:** Latest LTS (JavaScript runtime environment)
- **TypeScript:** Latest stable (Superset of JavaScript with static typing)

## 3. Architecture & Patterns

- **Monorepo Architecture:** Unified repository structure with apps/ and packages/ separation
- **Turborepo Pipeline:** Task dependency graph with intelligent caching and parallelization
- **Workspace Management:** pnpm workspaces for internal package linking
- **Atomic Deployments:** Independent deployment strategy for each application
- **Conventional Commits:** Standardized commit message format for automated versioning

## 4. UI/Frontend

- **Chakra UI:** Latest stable (Design system and accessible component library)
- **Tailwind CSS:** Latest stable (Utility-first CSS framework for custom designs)
- **Zustand:** Latest stable (Lightweight state management solution)
- **React Hooks:** Built-in (State management and side effects handling)
- **App Router:** Next.js 14+ (File-based routing with server components)

## 5. Backend/API

- **Express.js:** Latest stable (Minimalist web framework for Node.js)
- **Zod:** Latest stable (TypeScript-first schema validation library)
- **MongoDB:** Latest stable (Document-based NoSQL database)
- **Mongoose:** Latest stable (MongoDB ODM for structured database interactions)
- **MongoDB Driver:** Official Node.js driver (Low-level database operations)

## 6. Platform Integration

- **Vercel:** Production hosting (Frontend deployment platform optimized for Next.js)
- **Render:** Production hosting (Backend deployment platform for Node.js services)
- **MongoDB Atlas:** Production database (Fully managed cloud MongoDB service)
- **Docker:** Latest stable (Containerization for backend deployment)

## 7. Development Tools & Quality

- **ESLint:** Latest stable (JavaScript/TypeScript linting with shared configuration)
- **Prettier:** Latest stable (Code formatting with consistent style rules)
- **Turbo:** Latest stable (Build system orchestration and caching)
- **Git:** Version control (Atomic commits across multiple packages)

## 8. Code Quality & Validation

- **TypeScript:** Latest stable (Static type checking across all packages)
- **Zod:** Latest stable (Runtime schema validation for API requests/responses)
- **ESLint:** Latest stable (Code quality enforcement with custom rule sets)
- **Shared TypeScript Config:** Centralized tsconfig.json for consistent compiler settings
- **Shared ESLint Config** Custom configuration package (@project-name/eslint-config)

## 9. Observability & Monitoring

- **Turborepo Cache:** Built-in (Local and remote caching for build performance)
- **Vercel Analytics:** Built-in (Frontend performance and usage monitoring)
- **Render Monitoring:** Built-in (Backend service health and performance tracking)
- **MongoDB Atlas Monitoring:** Built-in (Database performance and health metrics)

## 10. Content & Localization

- **Static Assets:** Next.js public/ directory (Static file serving)
- **Server-Side Rendering:** Next.js App Router (Dynamic content generation)
- **Static Site Generation:** Next.js (Pre-rendered pages for performance)

## 11. External Services

- **MongoDB Atlas:** Cloud database service (Managed MongoDB hosting)
- **Vercel:** Frontend hosting (Serverless deployment platform)
- **Render:** Backend hosting (Container-based application platform)
- **Docker Registry:** Render's container registry (Image storage and distribution)

## 12. Build & Deployment

- **Turborepo:** Latest stable (Monorepo build orchestration and task running)
- **GitHub Actions:** CI/CD (Automated testing, building, and deployment)
- **Turbo Prune:** Built-in (Minimal subtree creation for optimized deployments)
- **Docker:** Latest stable (Backend containerization and deployment)
- **Vercel CLI:** Latest stable (Frontend deployment automation)

## 13. Infrastructure & Hosting

### Frontend Infrastructure
- **Vercel:** Production hosting (Zero-configuration Next.js deployment)
- **Vercel Edge Network:** Global CDN (Fast content delivery worldwide)
- **Automatic Scaling:** Built-in (Serverless function scaling)

### Backend Infrastructure
- **Render:** Production hosting (Container-based Node.js deployment)
- **Docker Containers:** Isolated application environments
- **Automatic Deployments:** Git-based deployment triggers

### Database Infrastructure
- **MongoDB Atlas:** Cloud database (Fully managed MongoDB clusters)
- **Automatic Backups:** Built-in (Point-in-time recovery capabilities)
- **Global Clusters:** Multi-region data distribution

## 14. Asset Management

- **Next.js Static Assets:** Built-in (Optimized static file serving)
- **Next.js Image Optimization:** Built-in (Automatic image optimization and resizing)
- **Tailwind CSS:** Utility-first styling (Optimized CSS generation)
- **Public Directory:** Static asset storage in Next.js apps

## 15. Version Control & Workflow

- **Git:** Distributed version control (Atomic commits across packages)
- **Conventional Commits:** Standardized commit format (Automated changelog generation)
- **GitHub:** Repository hosting (Source code management and collaboration)
- **Branch Protection:** Main branch protection (Required PR reviews and status checks)
- **Monorepo Workflows:** Single repository for all applications and packages

---

## Package Structure Standards

### Apps Directory (`/apps/`)
- **web:** Next.js frontend application
- **api:** Express.js backend service
- **admin:** (Future) Administrative dashboard

### Packages Directory (`/packages/`)
- **@project-name/ui:** Shared React components and design system
- **@project-name/eslint-config:** Shared ESLint configuration
- **@project-name/typescript-config:** Shared TypeScript configuration
- **@project-name/utils:** Helper functions and utility libraries
- **@project-name/types:** Shared TypeScript type definitions

---

## Configuration Principles

1. **Root-level Configuration:** Global tooling configs at monorepo root
2. **Turborepo Orchestration:** All scripts run through Turborepo for caching benefits
3. **Shared Configurations:** Centralized configs in packages/ for reusability
4. **Scoped Packages:** All internal packages use @project-name/ scope
5. **Minimal Package Scripts:** Individual package.json files delegate to Turborepo

---

*This document must be updated whenever new technologies are introduced or existing ones are modified. All team members must reference this document when making technology decisions.*
