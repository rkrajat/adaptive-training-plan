# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-11-03-production-deployment/spec.md

> Created: 2025-11-03
> Status: Ready for Implementation

## Tasks

- [x] 1. Setup Vercel Frontend Deployment
  - [x] 1.1 Create Vercel account and install Vercel CLI if needed
  - [x] 1.2 Link GitHub repository to Vercel and create new project
  - [x] 1.3 Configure Vercel project settings (root directory: `apps/web`, framework: Next.js, build command with Turborepo)
  - [ ] 1.4 Configure Vercel environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRAVA_CLIENT_ID`, `TURBO_TOKEN`, `TURBO_TEAM`)
  - [x] 1.5 Set production branch to `main` and enable preview deployments
  - [x] 1.6 Perform manual deployment test via Vercel dashboard
  - [x] 1.7 Verify frontend is accessible at Vercel-provided URL (https://adaptive-training-plan.vercel.app)
  - [ ] 1.8 Document Vercel project details (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) for GitHub Actions

- [x] 2. Setup Fly.io Backend Deployment
  - [x] 2.1 Create Fly.io account and install flyctl CLI
  - [x] 2.2 Create Dockerfile in root as `Dockerfile.api` with multi-stage build (switched to CommonJS)
  - [x] 2.3 Create `fly.toml` configuration file in `apps/api/` with health checks and deployment settings
  - [x] 2.4 Add health check endpoint (`GET /health`) to Express.js application (already existed)
  - [x] 2.5 Initialize Fly.io app `adaptive-training-plan-api`
  - [x] 2.6 Configure Fly.io secrets (`MONGODB_URI`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `JWT_SECRET`, `FRONTEND_URL`, `OPENAI_API_KEY`, `STRAVA_REDIRECT_URI`)
  - [x] 2.7 Perform manual deployment test with `flyctl deploy`
  - [x] 2.8 Verify backend is accessible at Fly.io URL (https://adaptive-training-plan-api.fly.dev) and health check returns 200 OK
  - [ ] 2.9 Test MongoDB Atlas connection from Fly.io app (check logs)
  - [ ] 2.10 Generate and document Fly.io API token for GitHub Actions

- [ ] 3. Configure MongoDB Atlas and Strava API
  - [ ] 3.1 Configure MongoDB Atlas network access to allow connections from `0.0.0.0/0`
  - [ ] 3.2 Create production database user with `readWrite` permissions
  - [ ] 3.3 Test MongoDB connection string from local environment
  - [ ] 3.4 Register Strava OAuth application at https://www.strava.com/settings/api
  - [ ] 3.5 Configure Strava OAuth callback URL to Vercel deployment URL
  - [ ] 3.6 Document Strava Client ID and Client Secret

- [ ] 4. Setup Turborepo Remote Caching
  - [ ] 4.1 Run `npx turbo login` and authenticate with Vercel
  - [ ] 4.2 Run `npx turbo link` to link repository to Vercel
  - [ ] 4.3 Document `TURBO_TOKEN` and `TURBO_TEAM` values
  - [ ] 4.4 Verify `turbo.json` has correct cache configuration
  - [ ] 4.5 Test remote caching locally with `pnpm turbo run build`
  - [ ] 4.6 Verify cache hits in Turborepo output

- [ ] 5. Configure Backend CORS
  - [ ] 5.1 Install `cors` package in backend if not already installed
  - [ ] 5.2 Add CORS middleware to Express.js application with `FRONTEND_URL` origin
  - [ ] 5.3 Configure credentials support for cookies/auth headers
  - [ ] 5.4 Test CORS configuration with frontend-backend communication
  - [ ] 5.5 Verify preflight OPTIONS requests are handled correctly

- [ ] 6. Create GitHub Actions CI/CD Pipeline
  - [ ] 6.1 Create `.github/workflows/deploy-production.yml` workflow file
  - [ ] 6.2 Configure `build-and-test` job with pnpm setup, dependency caching, and Turborepo build/test
  - [ ] 6.3 Configure `deploy-frontend` job that depends on build-and-test and deploys to Vercel
  - [ ] 6.4 Configure `deploy-backend` job that depends on build-and-test and deploys to Fly.io
  - [ ] 6.5 Add GitHub repository secrets (`TURBO_TOKEN`, `TURBO_TEAM`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `FLY_API_TOKEN`)
  - [ ] 6.6 Test workflow by pushing to main branch
  - [ ] 6.7 Verify all jobs complete successfully
  - [ ] 6.8 Check deployment logs for both frontend and backend

- [ ] 7. End-to-End Deployment Verification
  - [ ] 7.1 Verify frontend is accessible at production URL
  - [ ] 7.2 Verify backend health check endpoint returns 200 OK
  - [ ] 7.3 Test API calls from frontend to backend
  - [ ] 7.4 Verify CORS is working (no browser console errors)
  - [ ] 7.5 Test Strava OAuth flow end-to-end
  - [ ] 7.6 Verify MongoDB connection is working (create/read test data)
  - [ ] 7.7 Check Vercel Analytics for frontend metrics
  - [ ] 7.8 Check Fly.io monitoring for backend health
  - [ ] 7.9 Verify Turborepo cache hits in GitHub Actions logs
  - [ ] 7.10 Document final production URLs and rollback procedures
