# Product Roadmap

## Phase 1: MVP Foundation

**Goal:** Establish core infrastructure and basic Strava integration to prove technical feasibility.

**Success Criteria:** User can connect Strava account, view their activity data, and see monorepo builds successfully.

### Features

- [ ] Monorepo Setup - Initialize Turborepo with apps/web and apps/api structure, configure pnpm workspaces, shared TypeScript/ESLint configs `M`
- [ ] Frontend Shell - Create Next.js app with Chakra UI, basic routing, landing page, and dashboard layout `S`
- [ ] Backend API Foundation - Set up Express.js server with TypeScript, Zod validation, error handling middleware `S`
- [ ] MongoDB Connection - Configure MongoDB Atlas, create Mongoose connection, define initial User schema `S`
- [ ] Strava OAuth Flow - Implement OAuth authorization, token exchange, token storage in database `M`
- [ ] Fetch Strava Activities - Retrieve past 30 days of activities via Strava API, display in dashboard `M`
- [ ] Deployment Pipeline - Configure Vercel deployment for frontend, Render deployment for backend, CI/CD with GitHub Actions `M`

### Dependencies

- Strava Developer Application credentials
- MongoDB Atlas cluster provisioned
- Vercel and Render accounts configured

---

## Phase 2: Training Plan & Recommendations

**Goal:** Enable users to input training plans and receive AI-powered weekly recommendations.

**Success Criteria:** User can upload training plan, receive personalized recommendation based on Strava data, and regenerate recommendations.

### Features

- [ ] Training Plan Input - UI for manual training plan entry or file upload (CSV/PDF), parse and store structured plan data `L`
- [ ] Week Detection - Automatically identify current week of training plan based on start date and plan structure `S`
- [ ] Data Analysis Engine - Analyze Strava metrics: training load, heart rate trends, sleep patterns, frequency/volume analysis `L`
- [ ] AI Recommendation Generator - Generate personalized weekly adjustments using LLM (OpenAI/Anthropic API) based on analysis `L`
- [ ] Recommendation Display - Show recommendations with plain-language explanations, highlight specific workout modifications `M`
- [ ] Regenerate Recommendations - Allow users to request alternative recommendations with different adjustment strategies `M`
- [ ] Recommendation History - Store and display past recommendations for user reference `S`

### Dependencies

- Phase 1 completion (Strava integration working)
- LLM API access (OpenAI or Anthropic)
- Training plan data structure finalized

---


