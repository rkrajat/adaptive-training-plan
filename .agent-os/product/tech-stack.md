# Technical Stack

## Architecture

**Monorepo Architecture:** Turborepo-based monorepo with separate apps for frontend and backend, shared packages for common code.

## Core Technologies

### Application Framework
- **Next.js:** Latest stable with App Router (Frontend framework with SSR/SSG capabilities)
- **Express.js:** Latest stable (Backend web framework for API services)

### Runtime & Language
- **Node.js:** Latest LTS (Runtime environment for JavaScript backend and build tools)
- **TypeScript:** Latest stable (Primary language for type safety and improved code quality)

### Frontend Stack

#### UI Framework
- **React:** Latest stable (Frontend UI library using functional components and hooks)

#### Component Library
- **Chakra UI:** Latest stable (Primary design system and accessible component library)
- **Tailwind CSS:** Latest stable (Utility-first CSS framework for custom designs)

#### State Management
- **Zustand:** Latest stable (Lightweight state management solution)
- **TanStack Query:** Latest stable (API data fetching and caching)

#### HTTP Client
- **ky:** Latest stable (Modern HTTP client by sindresorhus)

### Backend Stack

#### Web Framework
- **Express.js:** Latest stable (Minimalist web framework for Node.js)

#### Validation
- **Zod:** Latest stable (TypeScript-first schema validation library)

#### External API Integration
- **strava-v3:** v3.0.0 (Node.js wrapper for Strava V3 API with OAuth support)

### Database

#### Database System
- **MongoDB:** Latest stable (Document-based NoSQL database)

#### Database Driver & ODM
- **Mongoose:** Latest stable (MongoDB ODM for structured database interactions)
- **MongoDB Driver:** Official Node.js driver (Low-level database operations)

### Development Environment

#### Package Manager
- **pnpm:** Latest stable (Package manager for efficient disk usage and strict dependency management)

#### Build System
- **Turborepo:** Latest stable (Build system and task runner for monorepo orchestration)

#### Code Quality
- **ESLint:** Latest stable (JavaScript/TypeScript linting with shared configuration)
- **Prettier:** Latest stable (Code formatting with consistent style rules)
- **TypeScript:** Strict mode (Static type checking across all packages)

### Deployment & Hosting

#### Frontend Hosting
- **Vercel:** Production hosting platform optimized for Next.js
- **Vercel Edge Network:** Global CDN for fast content delivery
- **Automatic Scaling:** Built-in serverless function scaling

#### Backend Hosting
- **Render:** Production hosting for containerized Node.js services
- **Docker:** Latest stable (Containerization for backend deployment)
- **Automatic Deployments:** Git-based deployment triggers

#### Database Hosting
- **MongoDB Atlas:** Fully managed cloud MongoDB service
- **Automatic Backups:** Built-in point-in-time recovery
- **Global Clusters:** Multi-region data distribution

### CI/CD & Version Control

#### Version Control
- **Git:** Distributed version control with atomic commits
- **GitHub:** Repository hosting and source code management
- **Conventional Commits:** Standardized commit format for automated changelog

#### CI/CD
- **GitHub Actions:** Automated testing, building, and deployment
- **Turbo Prune:** Minimal subtree creation for optimized deployments

### Observability & Monitoring

- **Turborepo Cache:** Local and remote caching for build performance
- **Vercel Analytics:** Frontend performance and usage monitoring
- **Render Monitoring:** Backend service health and performance tracking
- **MongoDB Atlas Monitoring:** Database performance and health metrics

## Package Structure

### Apps Directory (`/apps/`)
- **web:** Next.js frontend application
- **api:** Express.js backend service

### Packages Directory (`/packages/`)
- **@adaptive-training-plan/ui:** Shared React components and design system
- **@adaptive-training-plan/eslint-config:** Shared ESLint configuration
- **@adaptive-training-plan/typescript-config:** Shared TypeScript configuration
- **@adaptive-training-plan/utils:** Helper functions and utility libraries
- **@adaptive-training-plan/types:** Shared TypeScript type definitions

## Import Strategy

**Node.js ES Modules:** Standard ES module imports using TypeScript with Node.js resolution

## Asset Management

- **Next.js Static Assets:** Built-in optimized static file serving
- **Next.js Image Optimization:** Automatic image optimization and resizing
- **Tailwind CSS:** Utility-first styling with optimized CSS generation
- **Public Directory:** Static asset storage in Next.js apps

## Code Repository

**Repository URL:** https://github.com/rajatkumar/adaptive-training-plan (placeholder - update with actual URL)

## Configuration Principles

1. **Root-level Configuration:** Global tooling configs at monorepo root
2. **Turborepo Orchestration:** All scripts run through Turborepo for caching benefits
3. **Shared Configurations:** Centralized configs in packages/ for reusability
4. **Scoped Packages:** All internal packages use @adaptive-training-plan/ scope
5. **Minimal Package Scripts:** Individual package.json files delegate to Turborepo
