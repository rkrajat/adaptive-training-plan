# Spec Requirements Document

> Spec: Production Deployment Setup
> Created: 2025-11-03
> Status: Planning

## Overview

Establish a fully automated CI/CD pipeline to deploy the Adaptive Training Plan monorepo to production environments. The frontend (Next.js) will deploy to Vercel, the backend (Express.js) will deploy to Fly.io, and both will connect to the existing MongoDB Atlas database with zero-downtime deployments triggered automatically on every push to the main branch.

## User Stories

### Automated Production Deployment

As a developer, I want to automatically deploy both frontend and backend to production when I push code to the main branch, so that new features and fixes reach users without manual intervention.

**Workflow**: Developer pushes code to main → GitHub Actions triggers → Turborepo builds both apps with caching → Frontend deploys to Vercel → Backend deploys to Fly.io → Health checks verify deployment → Developers receive notification of success/failure.

### Monorepo Build Optimization

As a developer, I want the CI/CD pipeline to leverage Turborepo's caching and only rebuild changed packages, so that deployment times are minimized and infrastructure costs are reduced.

**Workflow**: CI pipeline checks what changed → Turborepo determines affected packages → Only changed apps/packages are rebuilt → Remote cache stores build artifacts → Subsequent builds reuse cached artifacts when possible.

### Environment Configuration Management

As a developer, I want environment variables and secrets properly configured across all deployment platforms, so that the application can securely connect to MongoDB Atlas, Strava API, and other services in production.

**Workflow**: Developer configures secrets in GitHub, Vercel, and Fly.io dashboards → CI/CD pipeline injects environment variables during build/runtime → Applications connect to services using secure credentials → No secrets are exposed in source code or logs.

## Spec Scope

1. **Vercel Frontend Deployment** - Configure Vercel project with automatic deployments from main branch, including build settings, environment variables, and domain configuration
2. **Fly.io Backend Deployment** - Set up Fly.io application with Dockerfile, fly.toml configuration, and deployment automation via GitHub Actions
3. **GitHub Actions CI/CD Pipeline** - Create workflow that builds monorepo with Turborepo, runs tests, and deploys both frontend and backend sequentially
4. **Turborepo Pruning Strategy** - Implement turbo prune for backend to create minimal Docker build context, reducing image size and build time
5. **Environment Variables Configuration** - Document and configure all required secrets and environment variables across GitHub Actions, Vercel, and Fly.io platforms

## Out of Scope

- Staging or preview environment setup (production only)
- Custom domain configuration (using platform-provided domains)
- Advanced monitoring and error tracking (Sentry, Datadog, etc.)
- Database migration or seeding scripts (existing MongoDB Atlas connection)
- Rollback automation (manual rollback via platform dashboards)
- Blue-green or canary deployment strategies
- Multi-region deployment

## Expected Deliverable

1. **Functional CI/CD Pipeline**: Pushing to main branch successfully builds and deploys both frontend to Vercel and backend to Fly.io, with all services running and accessible via platform URLs
2. **Working Application**: Frontend at *.vercel.app can communicate with backend at *.fly.dev, which successfully connects to MongoDB Atlas database
3. **Documentation**: Complete environment variable reference and deployment troubleshooting guide for team members to understand the deployment process

## Spec Documentation

- Tasks: @.agent-os/specs/2025-11-03-production-deployment/tasks.md
- Technical Specification: @.agent-os/specs/2025-11-03-production-deployment/sub-specs/technical-spec.md
