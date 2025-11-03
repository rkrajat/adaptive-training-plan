# Environment Variables Specification

This document details all environment variables required for the production deployment specified in @.agent-os/specs/2025-11-03-production-deployment/spec.md

---

## GitHub Actions Secrets

Configure these secrets in GitHub repository settings under **Settings → Secrets and variables → Actions → New repository secret**:

### Turborepo Remote Caching
| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `TURBO_TOKEN` | Turborepo remote cache authentication token | 1. Run `npx turbo login`<br>2. Authenticate with Vercel<br>3. Run `npx turbo link`<br>4. Token will be shown in output |
| `TURBO_TEAM` | Turborepo team/organization identifier | Displayed during `npx turbo link` command |

### Vercel Deployment
| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel API authentication token | 1. Go to Vercel Dashboard<br>2. Settings → Tokens<br>3. Create new token with deployment scope |
| `VERCEL_ORG_ID` | Vercel organization identifier | 1. Go to Vercel project settings<br>2. Copy from `.vercel/project.json` after first manual deploy<br>3. Or find in project settings URL |
| `VERCEL_PROJECT_ID` | Vercel project identifier | 1. Go to Vercel project settings<br>2. Copy from `.vercel/project.json` after first manual deploy<br>3. Or find in project settings |

### Fly.io Deployment
| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `FLY_API_TOKEN` | Fly.io API authentication token | 1. Run `flyctl auth login`<br>2. Run `flyctl auth token`<br>3. Copy the output token |

---

## Vercel Environment Variables

Configure these in Vercel dashboard under **Project Settings → Environment Variables**:

### Public Variables (Client-side accessible)
| Variable Name | Description | Example Value | Required |
|--------------|-------------|---------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://adaptive-training-plan-api.fly.dev` | Yes |

### Build-time Variables
| Variable Name | Description | Example Value | Required |
|--------------|-------------|---------------|----------|
| `TURBO_TOKEN` | Turborepo remote cache token | Same as GitHub secret | Yes |
| `TURBO_TEAM` | Turborepo team identifier | Same as GitHub secret | Yes |

**Notes**:
- Set environment to: **Production**
- All variables should be set for production environment only (per requirements)
- The frontend is a **pure client-side React application** with no API routes
- **No MongoDB connection** needed in frontend (all data access through backend API)
- **No Strava OAuth** handled by frontend (all authentication through backend API)
- Frontend only communicates with backend via `NEXT_PUBLIC_API_URL`

---

## Fly.io Secrets

Configure these using `flyctl secrets set` command or Fly.io dashboard:

### Required Application Secrets
| Secret Name | Description | Example Value | Required |
|------------|-------------|---------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` | Yes |
| `STRAVA_CLIENT_ID` | Strava OAuth client ID | `12345` | Yes |
| `STRAVA_CLIENT_SECRET` | Strava OAuth client secret | `abc123...` | Yes |
| `STRAVA_REDIRECT_URI` | OAuth callback URL | `https://<app>.fly.dev/api/auth/callback` | Yes |
| `JWT_SECRET` | Secret key for signing JWT tokens | Generate with `openssl rand -hex 32` | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI recommendations | `sk-proj-...` | Yes |
| `FRONTEND_URL` | Frontend application URL for CORS | `https://<project>.vercel.app` | Yes |
| `NODE_ENV` | Node environment | `production` | Yes (set in fly.toml) |
| `PORT` | Application port | `8080` | Yes (set in fly.toml) |

### Optional Configuration Secrets
| Secret Name | Description | Default Value | Required |
|------------|-------------|---------------|----------|
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` | No |
| `OPENAI_TEMPERATURE` | AI response creativity (0-2) | `0.7` | No |
| `STRAVA_LOOKBACK_DAYS` | Days of activity history to fetch | `30` | No |
| `STRAVA_ACTIVITIES_PER_PAGE` | Activities per API request | `200` | No |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

**Set Commands**:
```bash
# Required secrets
flyctl secrets set MONGODB_URI="mongodb+srv://..."
flyctl secrets set STRAVA_CLIENT_ID="12345"
flyctl secrets set STRAVA_CLIENT_SECRET="abc123..."
flyctl secrets set STRAVA_REDIRECT_URI="https://<app-name>.fly.dev/api/auth/callback"
flyctl secrets set JWT_SECRET="$(openssl rand -hex 32)"
flyctl secrets set OPENAI_API_KEY="sk-proj-..."
flyctl secrets set FRONTEND_URL="https://<project-name>.vercel.app"

# Optional secrets (only if you want to override defaults)
flyctl secrets set OPENAI_MODEL="gpt-4o-mini"
flyctl secrets set OPENAI_TEMPERATURE="0.7"
flyctl secrets set STRAVA_LOOKBACK_DAYS="30"
```

**Notes**:
- Secrets are encrypted at rest
- Changing secrets triggers automatic redeployment
- View secret names (not values) with `flyctl secrets list`

---

## MongoDB Atlas Configuration

### Connection String Components

**Format**:
```
mongodb+srv://<username>:<password>@<cluster-name>.<subdomain>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

**Example**:
```
mongodb+srv://prod-user:SecureP@ssw0rd@cluster0.abc123.mongodb.net/adaptive-training-plan?retryWrites=true&w=majority
```

### Required MongoDB Atlas Settings

1. **Network Access**:
   - Go to Network Access in MongoDB Atlas
   - Add IP Address: `0.0.0.0/0` (allow all - Fly.io has dynamic IPs)
   - Or add specific Fly.io IP ranges if available

2. **Database User**:
   - Create dedicated production user in Database Access
   - Username: `prod-user` (or similar)
   - Password: Generate strong password (min 16 characters)
   - Roles: `readWrite` on production database

3. **Database Name**:
   - Use consistent name: `adaptive-training-plan`
   - Ensure it matches across all services

---

## Strava API Credentials

### OAuth Application Setup

1. **Register Application**:
   - Go to https://www.strava.com/settings/api
   - Create new application
   - Application Name: `Adaptive Training Plan`
   - Authorization Callback Domain: `<app-name>.fly.dev` (**Backend domain, not frontend**)

2. **Obtain Credentials**:
   - Client ID: Display in Strava API settings (public)
   - Client Secret: Display in Strava API settings (private)

3. **Configure OAuth Flow**:
   - Redirect URI: `https://<app-name>.fly.dev/api/auth/callback` (**Backend handles OAuth**)
   - Scope: `read,activity:read_all`

**Important**: OAuth authentication is handled entirely by the backend API at Fly.io. The frontend redirects users to the backend's OAuth endpoint, and the backend handles the Strava OAuth flow and returns a JWT token to the frontend.

---

## Environment Variable Checklist

Use this checklist before first deployment:

### GitHub Secrets ✓
- [ ] `TURBO_TOKEN` configured
- [ ] `TURBO_TEAM` configured
- [ ] `VERCEL_TOKEN` configured
- [ ] `VERCEL_ORG_ID` configured
- [ ] `VERCEL_PROJECT_ID` configured
- [ ] `FLY_API_TOKEN` configured

### Vercel Environment Variables ✓
- [ ] `NEXT_PUBLIC_API_URL` configured
- [ ] `TURBO_TOKEN` configured
- [ ] `TURBO_TEAM` configured

### Fly.io Secrets (Required) ✓
- [ ] `MONGODB_URI` configured
- [ ] `STRAVA_CLIENT_ID` configured
- [ ] `STRAVA_CLIENT_SECRET` configured
- [ ] `STRAVA_REDIRECT_URI` configured
- [ ] `JWT_SECRET` generated and configured
- [ ] `OPENAI_API_KEY` configured
- [ ] `FRONTEND_URL` configured

### Fly.io Secrets (Optional) ✓
- [ ] `OPENAI_MODEL` configured (if overriding default)
- [ ] `OPENAI_TEMPERATURE` configured (if overriding default)
- [ ] `STRAVA_LOOKBACK_DAYS` configured (if overriding default)
- [ ] `STRAVA_ACTIVITIES_PER_PAGE` configured (if overriding default)
- [ ] `JWT_EXPIRES_IN` configured (if overriding default)
- [ ] `RATE_LIMIT_WINDOW_MS` configured (if overriding default)
- [ ] `RATE_LIMIT_MAX_REQUESTS` configured (if overriding default)

### MongoDB Atlas ✓
- [ ] Network access configured (0.0.0.0/0)
- [ ] Production database user created
- [ ] Connection string tested
- [ ] Database name consistent across services

### Strava API ✓
- [ ] OAuth application created
- [ ] Callback URL configured (must point to backend: `<app>.fly.dev/api/auth/callback`)
- [ ] Client ID and Secret obtained

### OpenAI API ✓
- [ ] API key obtained from OpenAI dashboard
- [ ] API key configured in Fly.io secrets

---

## Security Best Practices

1. **Never commit secrets to Git**:
   - Use `.env.local` for local development (gitignored)
   - All production secrets in platform dashboards/CLI only

2. **Rotate secrets regularly**:
   - JWT secrets every 90 days
   - MongoDB passwords every 180 days
   - API tokens yearly

3. **Principle of least privilege**:
   - MongoDB users should have minimum required permissions
   - API tokens should have minimum required scopes

4. **Environment separation**:
   - Never use production secrets in development
   - Use separate Strava OAuth apps for dev/prod

---
