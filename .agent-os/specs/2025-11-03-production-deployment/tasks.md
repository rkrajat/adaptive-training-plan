# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-11-03-production-deployment/spec.md

> Created: 2025-11-03
> Status: Ready for Implementation

## Tasks

- [x] 1. Setup Vercel Frontend Deployment
  - [x] 1.1 Create Vercel account and install Vercel CLI if needed
  - [x] 1.2 Link GitHub repository to Vercel and create new project
  - [x] 1.3 Configure Vercel project settings (root directory: `apps/web`, framework: Next.js, build command with Turborepo)
  - [x] 1.4 Configure Vercel environment variables (`NEXT_PUBLIC_API_URL` configured, Turborepo caching skipped)
  - [x] 1.5 Set production branch to `main` and enable preview deployments
  - [x] 1.6 Perform manual deployment test via Vercel dashboard
  - [x] 1.7 Verify frontend is accessible at Vercel-provided URL (https://adaptive-training-plan.vercel.app)
  - [x] 1.8 Vercel auto-deploys via GitHub integration (no GitHub Actions needed)

- [x] 2. Setup Fly.io Backend Deployment
  - [x] 2.1 Create Fly.io account and install flyctl CLI
  - [x] 2.2 Create Dockerfile in root as `Dockerfile.api` with multi-stage build (switched to CommonJS)
  - [x] 2.3 Create `fly.toml` configuration file in `apps/api/` with health checks and deployment settings
  - [x] 2.4 Add health check endpoint (`GET /health`) to Express.js application (already existed)
  - [x] 2.5 Initialize Fly.io app `adaptive-training-plan-api`
  - [x] 2.6 Configure Fly.io secrets (`MONGODB_URI`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `JWT_SECRET`, `FRONTEND_URL`, `OPENAI_API_KEY`, `STRAVA_REDIRECT_URI`)
  - [x] 2.7 Perform manual deployment test with `flyctl deploy`
  - [x] 2.8 Verify backend is accessible at Fly.io URL (https://adaptive-training-plan-api.fly.dev) and health check returns 200 OK
  - [x] 2.9 Test MongoDB Atlas connection from Fly.io app (verified working)
  - [x] 2.10 Using manual deployments with `flyctl deploy` (GitHub Actions skipped)

- [x] 3. Configure MongoDB Atlas and Strava API (already configured via Fly.io secrets)
  - [x] 3.1 MongoDB Atlas network access configured
  - [x] 3.2 Production database user configured
  - [x] 3.3 MongoDB connection verified from Fly.io
  - [x] 3.4 Strava OAuth application already registered
  - [x] 3.5 Strava OAuth callback URL configured in backend
  - [x] 3.6 Strava credentials configured via Fly.io secrets

- [x] 4. Setup Turborepo Remote Caching (skipped - not needed for current deployment)

- [x] 5. Configure Backend CORS (already implemented in codebase)
  - [x] 5.1 `cors` package already installed
  - [x] 5.2 CORS middleware configured with `FRONTEND_URL` origin
  - [x] 5.3 Credentials support configured
  - [x] 5.4 Frontend-backend communication verified working
  - [x] 5.5 Preflight requests handled correctly

- [x] 6. Create GitHub Actions CI/CD Pipeline (skipped - using native platform deployments)
  - Vercel auto-deploys frontend via GitHub integration
  - Backend deployed manually with `flyctl deploy` when needed

- [x] 7. End-to-End Deployment Verification
  - [x] 7.1 Frontend accessible at https://adaptive-training-plan.vercel.app
  - [x] 7.2 Backend health check returns 200 OK at https://adaptive-training-plan-api.fly.dev/health
  - [x] 7.3 API calls from frontend to backend working
  - [x] 7.4 CORS working (no browser console errors)
  - [x] 7.5 Strava OAuth flow working end-to-end
  - [x] 7.6 MongoDB connection verified working
  - [x] 7.7 Vercel Analytics available in dashboard
  - [x] 7.8 Fly.io monitoring available in dashboard
  - [x] 7.9 Turborepo caching skipped (not using GitHub Actions)
  - [x] 7.10 Production URLs documented above
