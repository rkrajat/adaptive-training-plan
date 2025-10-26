# Adaptive Training Plan

An online platform that helps runners intelligently adjust their training plans based on recent performance and health data from Strava.

## 🏃 Project Overview

Adaptive Training Plan analyzes your past month of Strava data (distance, heart rate, sleep) and provides AI-powered weekly recommendations to optimize your training, prevent overtraining, and improve race outcomes.

## 🏗️ Monorepo Structure

This project uses Turborepo to manage a monorepo containing:

```
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # Express.js backend (port 4000)
├── packages/
│   ├── typescript-config/   # Shared TypeScript configurations
│   └── eslint-config/        # Shared ESLint configurations
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0

Install pnpm globally if you haven't:
```bash
npm install -g pnpm@9.15.0
```

### Installation

```bash
# Install all dependencies
pnpm install
```

### Development

```bash
# Run both frontend and backend
pnpm dev

# Run only frontend (Next.js on port 3000)
pnpm dev:web

# Run only backend (Express.js on port 4000)
pnpm dev:api
```

The applications will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health

### Building

```bash
# Build all applications
pnpm build
```

### Linting & Type Checking

```bash
# Run ESLint across all packages
pnpm lint

# Run TypeScript type checking
pnpm typecheck
```

## 📦 Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **UI**: Chakra UI (planned)
- **State Management**: Zustand (planned)
- **Data Fetching**: TanStack Query (planned)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose (planned)
- **Validation**: Zod (planned)

### Development Tools
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode

## 🎯 Key Features (Planned)

1. **Strava Integration** - OAuth connection to fetch running data
2. **Training Plan Input** - Upload or define your current training plan
3. **AI-Powered Recommendations** - Weekly training adjustments based on your data
4. **Recommendation Regeneration** - Request alternative recommendations
5. **Performance Analytics** - Visualize training trends over time

## 📚 Documentation

- [Product Brief](./docs/PRODUCT.md) - Detailed product requirements
- [Technical Design](./docs/MONOREPO_TECHNICAL_DESIGN_BLUEPRINT.md) - Architecture overview
- [Deployment Guide](./docs/MONOREPO_STRUCTURE_AND_DEPLOYMENT_WITH_TURBOREPO.md) - Deployment strategy


## 📄 License

Private - All Rights Reserved
