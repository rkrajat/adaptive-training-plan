# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-03-production-deployment/spec.md

> Created: 2025-11-03
> Version: 1.0.0

## Architecture Overview

**Frontend Architecture**:
- Pure client-side React application built with Next.js (App Router)
- No server-side API routes (no `/app/api` directory)
- No direct database connections
- No OAuth handling - all authentication delegated to backend
- Communicates with backend via REST API calls using `NEXT_PUBLIC_API_URL`
- Uses JWT tokens stored in localStorage for authenticated requests

**Backend Architecture**:
- Express.js REST API server
- Handles all authentication (Strava OAuth) and returns JWT tokens
- Direct MongoDB connection for data persistence
- OpenAI API integration for AI-powered training recommendations
- CORS configured to accept requests from frontend domain

**Data Flow**:
1. Frontend redirects user to backend OAuth endpoint
2. Backend handles Strava OAuth and returns JWT token
3. Frontend stores JWT and includes it in Authorization header for all API calls
4. Backend validates JWT, processes requests, interacts with MongoDB/Strava/OpenAI
5. Backend returns data to frontend for display

---

## Technical Requirements

### 1. Vercel Frontend Deployment Configuration

**Platform Setup**:
- Create new Vercel project linked to GitHub repository
- Configure build settings for monorepo structure
- Set root directory to `apps/web`
- Framework preset: Next.js
- Build command: `cd ../.. && pnpm turbo run build --filter=web`
- Output directory: `.next`
- Install command: `pnpm install`

**Environment Variables** (Vercel Dashboard):
- `NEXT_PUBLIC_API_URL` - Backend API URL (will be Fly.io app URL)
- `TURBO_TOKEN` - Turborepo remote caching token
- `TURBO_TEAM` - Turborepo team identifier

**Note**: The frontend is a pure client-side React application with no API routes. It does not connect to MongoDB or handle OAuth directly. All authentication and data operations are handled by the backend API.

**Automatic Deployments**:
- Production branch: `main`
- Deploy on push: enabled
- Preview deployments: disabled (per requirements)

**Domain Configuration**:
- Use Vercel-provided domain: `*.vercel.app`
- SSL/TLS: Automatic via Vercel

---

### 2. Fly.io Backend Deployment Configuration

**Dockerfile Creation** (`apps/api/Dockerfile`):
```dockerfile
# Build stage using Turborepo prune
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy root-level files needed for pruning
COPY . .

# Prune the monorepo for the backend app
RUN pnpm turbo prune --scope=api --docker

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy pruned output
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/out/full/ .

# Build the backend
RUN pnpm turbo run build --filter=api

WORKDIR /app/apps/api

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]
```

**Fly.io Configuration** (`apps/api/fly.toml`):
```toml
app = "adaptive-training-plan-api"
primary_region = "iad" # Change to your preferred region

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"

[deploy]
  strategy = "immediate"
```

**Fly.io Setup Commands**:
```bash
# Install flyctl CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
flyctl auth login

# Create new Fly.io app
cd apps/api
flyctl launch --no-deploy

# Set secrets
flyctl secrets set MONGODB_URI="<atlas-connection-string>"
flyctl secrets set STRAVA_CLIENT_ID="<strava-client-id>"
flyctl secrets set STRAVA_CLIENT_SECRET="<strava-client-secret>"
flyctl secrets set STRAVA_REDIRECT_URI="https://<app-name>.fly.dev/api/auth/callback"
flyctl secrets set JWT_SECRET="<generated-secret>"
flyctl secrets set OPENAI_API_KEY="<openai-api-key>"
flyctl secrets set FRONTEND_URL="https://<project-name>.vercel.app"

# Manual first deployment (for testing)
flyctl deploy
```

**Health Check Endpoint** (Required in `apps/api/src/index.ts`):
```typescript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

---

### 3. GitHub Actions CI/CD Pipeline

**Workflow File** (`.github/workflows/deploy-production.yml`):
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        id: pnpm-cache
        run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all packages
        run: pnpm turbo run build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - name: Run tests
        run: pnpm turbo run test
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - name: Run linter
        run: pnpm turbo run lint

  deploy-frontend:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./apps/web

  deploy-backend:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Fly.io CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        working-directory: ./apps/api
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Required GitHub Secrets**:
- `TURBO_TOKEN` - Get from Vercel Turborepo dashboard
- `TURBO_TEAM` - Get from Vercel Turborepo dashboard
- `VERCEL_TOKEN` - Generate in Vercel account settings
- `VERCEL_ORG_ID` - Found in Vercel project settings
- `VERCEL_PROJECT_ID` - Found in Vercel project settings
- `FLY_API_TOKEN` - Generate with `flyctl auth token`

---

### 4. Turborepo Remote Caching Setup

**Enable Remote Caching**:
```bash
# Link to Vercel for remote caching
npx turbo login
npx turbo link
```

**Update `turbo.json`** (ensure correct cache configuration):
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!dist/**/*.map"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  },
  "globalDependencies": ["$TURBO_TOKEN", "$TURBO_TEAM"]
}
```

---

### 5. MongoDB Atlas Configuration

**Connection String Format**:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Required Configurations**:
- Network Access: Add `0.0.0.0/0` to IP allowlist (or Fly.io IP ranges if available)
- Database User: Create dedicated production user with appropriate permissions
- Connection Security: Use strong password, enable VPC peering if needed
- Database Name: Ensure consistent database name across environments

**Environment Variable Usage**:
- Backend: `MONGODB_URI` secret in Fly.io
- Frontend: No MongoDB connection needed (all data access through backend API)

---

### 6. Health Checks and Monitoring

**Backend Health Check**:
- Endpoint: `GET /health`
- Response: `200 OK` with JSON body `{ "status": "healthy", "timestamp": "..." }`
- Fly.io will check every 30 seconds (as per fly.toml)

**Frontend Monitoring**:
- Use Vercel Analytics (included by default)
- Monitor build times and deployment success rates in Vercel dashboard

**Database Monitoring**:
- Use MongoDB Atlas built-in monitoring
- Check connection counts, query performance, and storage metrics

---

### 7. Deployment Verification Steps

**Post-Deployment Checklist**:
1. Verify frontend is accessible at `<project>.vercel.app`
2. Verify backend is accessible at `<app>.fly.dev/health`
3. Test frontend → backend communication (API calls)
4. Verify backend → MongoDB Atlas connection (check logs)
5. Test Strava OAuth flow end-to-end
6. Check GitHub Actions workflow run status
7. Verify Turborepo cache hits in CI logs

**Rollback Procedure**:
- Vercel: Use Vercel dashboard to revert to previous deployment
- Fly.io: Run `flyctl releases list` and `flyctl releases rollback <version>`

---

### 8. CORS Configuration

**Backend CORS Setup** (Required for frontend-backend communication):
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://<project>.vercel.app',
  credentials: true,
}));
```

**Environment Variable**:
- Set `FRONTEND_URL` in Fly.io secrets to Vercel deployment URL

---

## Approach

The deployment strategy follows a monorepo-aware CI/CD pipeline with the following approach:

1. **Build Verification First**: All deployments must pass build, test, and lint checks before deploying to either frontend or backend
2. **Parallel Deployment**: Frontend and backend deploy in parallel after successful build verification to reduce total deployment time
3. **Turborepo Pruning**: Use `turbo prune` for Docker builds to create minimal, optimized images containing only necessary dependencies
4. **Remote Caching**: Leverage Vercel's Turborepo remote cache to speed up CI builds and avoid redundant work
5. **Health Checks**: Implement health checks on both platforms to ensure services are running correctly post-deployment
6. **Environment Isolation**: Use platform-native secrets management (Vercel environment variables, Fly.io secrets) to keep sensitive data secure
7. **Automatic Rollback**: Both platforms support quick rollbacks if issues are detected post-deployment

---

## External Dependencies

This deployment specification does not require any new external dependencies beyond what's already in the tech stack. All tools are standard deployment platforms:

- **Vercel** - Frontend hosting (already planned)
- **Fly.io** - Backend hosting (replacement for Render)
- **MongoDB Atlas** - Database (already set up)
- **GitHub Actions** - CI/CD automation (free for public repos)
- **Turborepo** - Build orchestration (already in tech stack)
