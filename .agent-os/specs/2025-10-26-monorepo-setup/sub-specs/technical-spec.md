# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-26-monorepo-setup/spec.md

## Technical Requirements

### Directory Structure

Create the following monorepo structure:

```
/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── app/                # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.mjs
│   │   ├── tsconfig.json       # Extends @adaptive-training-plan/typescript-config
│   │   └── .eslintrc.js        # Extends @adaptive-training-plan/eslint-config
│   └── api/                    # Express.js backend application
│       ├── src/
│       │   ├── index.ts        # Main Express server entry
│       │   └── routes/
│       ├── package.json
│       ├── tsconfig.json       # Extends @adaptive-training-plan/typescript-config
│       └── .eslintrc.js        # Extends @adaptive-training-plan/eslint-config
├── packages/
│   ├── typescript-config/      # Shared TypeScript configuration
│   │   ├── base.json           # Base tsconfig for all packages
│   │   ├── nextjs.json         # Next.js specific tsconfig
│   │   ├── node.json           # Node.js specific tsconfig
│   │   └── package.json
│   └── eslint-config/          # Shared ESLint configuration
│       ├── index.js            # Base ESLint config
│       ├── nextjs.js           # Next.js specific rules
│       ├── node.js             # Node.js specific rules
│       └── package.json
├── package.json                # Root package.json with workspaces
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── turbo.json                  # Turborepo pipeline configuration
└── README.md                   # Monorepo documentation
```

### Root Package Configuration

**package.json:**
- Define workspaces: `apps/*` and `packages/*`
- Include scripts: `dev`, `build`, `lint`, `typecheck`
- All scripts delegate to Turborepo: `turbo run <task>`
- Include devDependencies: `turbo`, `typescript`, `@types/node`

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Turborepo Configuration

**turbo.json** pipeline definitions:

1. **dev task:**
   - No caching (`cache: false`)
   - Persistent tasks for watch mode
   - Runs both web and api in parallel

2. **build task:**
   - Depends on `^build` (build dependencies first)
   - Outputs: `.next/**`, `dist/**`
   - Full caching enabled

3. **lint task:**
   - No dependencies
   - No outputs (just validation)
   - Full caching enabled

4. **typecheck task:**
   - No dependencies
   - No outputs (just validation)
   - Full caching enabled

### Shared TypeScript Configuration Package

**@adaptive-training-plan/typescript-config:**

Create three configuration files:

1. **base.json** - Base configuration for all packages:
   - `strict: true`
   - `esModuleInterop: true`
   - `skipLibCheck: true`
   - `forceConsistentCasingInFileNames: true`
   - `resolveJsonModule: true`
   - `isolatedModules: true`
   - `moduleResolution: "bundler"`
   - `module: "ESNext"`
   - `target: "ES2022"`

2. **nextjs.json** - Extends base.json with Next.js specific settings:
   - `lib: ["dom", "dom.iterable", "esnext"]`
   - `jsx: "preserve"`
   - `plugins: [{ "name": "next" }]`
   - `incremental: true`

3. **node.json** - Extends base.json with Node.js specific settings:
   - `lib: ["ES2022"]`
   - `module: "NodeNext"`
   - `moduleResolution: "NodeNext"`
   - `outDir: "dist"`

### Shared ESLint Configuration Package

**@adaptive-training-plan/eslint-config:**

Create three configuration files:

1. **index.js** - Base ESLint configuration:
   - Extends `eslint:recommended`, `plugin:@typescript-eslint/recommended`
   - Parser: `@typescript-eslint/parser`
   - Rules:
     - No `any` types: `@typescript-eslint/no-explicit-any: error`
     - No `var`: `no-var: error`
     - Prefer `const`: `prefer-const: error`
     - Named exports only: `import/no-default-export: error` (with Next.js exceptions)
     - Import order enforcement with groups

2. **nextjs.js** - Extends index.js with Next.js rules:
   - Extends `next/core-web-vitals`
   - Allow default exports for Next.js pages/layouts/routes
   - React hooks rules enabled

3. **node.js** - Extends index.js with Node.js rules:
   - Node.js specific environment variables
   - No console warnings disabled for backend

### Application Configurations

**apps/web (Next.js):**
- Package name: `web`
- Dependencies: `next`, `react`, `react-dom`
- DevDependencies: `@adaptive-training-plan/typescript-config`, `@adaptive-training-plan/eslint-config`, `typescript`, `@types/react`, `@types/node`
- Scripts: `dev: "next dev"`, `build: "next build"`, `start: "next start"`, `lint: "next lint"`, `typecheck: "tsc --noEmit"`
- Port: 3000

**apps/api (Express.js):**
- Package name: `api`
- Dependencies: `express`, `cors`
- DevDependencies: `@adaptive-training-plan/typescript-config`, `@adaptive-training-plan/eslint-config`, `typescript`, `@types/express`, `@types/node`, `tsx` (for dev server with hot reload)
- Scripts: `dev: "tsx watch src/index.ts"`, `build: "tsc"`, `start: "node dist/index.js"`, `typecheck: "tsc --noEmit"`
- Port: 4000

### Initial Application Code

**apps/web/app/page.tsx:**
```typescript
export const HomePage = () => {
  return (
    <div>
      <h1>Adaptive Training Plan</h1>
      <p>Welcome to the Adaptive Training Plan platform.</p>
    </div>
  );
};

export default HomePage;
```

**apps/api/src/index.ts:**
```typescript
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
```

### Root README.md

Include the following sections:
1. **Project Overview** - Brief description of Adaptive Training Plan
2. **Getting Started** - `pnpm install` and `pnpm dev` instructions
3. **Monorepo Structure** - Explanation of apps/ and packages/ directories
4. **Available Commands** - List of common Turborepo commands with descriptions
5. **Adding New Packages** - Instructions for creating new packages with proper configuration
6. **Tech Stack** - Link to tech-stack.md documentation

## External Dependencies

**turbo** (latest stable)
- **Purpose:** Monorepo build system and task orchestration with intelligent caching
- **Justification:** Required for Turborepo functionality; provides parallel execution, dependency graphs, and local/remote caching

**tsx** (latest stable)
- **Purpose:** TypeScript execution engine for development server with hot reload
- **Justification:** Enables rapid backend development with automatic recompilation; replaces ts-node with faster performance

**@typescript-eslint/parser** and **@typescript-eslint/eslint-plugin** (latest stable)
- **Purpose:** TypeScript-aware ESLint parsing and rules
- **Justification:** Required for linting TypeScript code with type-aware rules and strict mode enforcement

**eslint-config-next** (from Next.js, latest stable)
- **Purpose:** Next.js recommended ESLint configuration
- **Justification:** Provides Next.js best practices and catches common React/Next.js issues
