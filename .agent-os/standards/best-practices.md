# Agent OS Best Practices

## Context and Usage

This document serves as the **primary entry point** for all Agent OS development standards. When working on any React task, agents must apply these practices along with referenced domain-specific standards.

### Standards Hierarchy (NON-NEGOTIABLE)

1. **MANDATORY**: Apply ALL rules from this file first (ABSOLUTE REQUIREMENT)
2. **REQUIRED**: Follow referenced files for domain-specific details (ENFORCED BY REVIEW)
3. **ENFORCED BY TOOLING**: All code must pass ESLint, TypeScript strict mode, and Prettier (BLOCKS CI/MERGE)

### When to Reference Sub-standards

- **UI/Styling tasks**: Always reference `design/` standards
- **Data operations**: Always reference `data/` standards for REST API and Native Data patterns
- **Testing tasks**: Always reference `testing/` standards
- **Code formatting**: Always reference `code-style.md`

## Core Principles

### Component Architecture (NON-NEGOTIABLE)

- **MUST** use functional components with hooks exclusively (ENFORCED BY ESLint)
- **MUST** encapsulate related files in dedicated folders (REQUIRED)
- **MUST** separate concerns: components, types, styles, constants in dedicated files (MANDATORY)
- **ABSOLUTELY FORBIDDEN** class components entirely (BLOCKED BY LINTING)

### Type Safety (ENFORCED)

- **MUST** use TypeScript strict mode for maximum type safety (ENFORCED BY tsconfig.json)
- **MUST** define explicit types for all props and component interfaces (REQUIRED)
- **ABSOLUTELY FORBIDDEN** `any` type usage (BLOCKED BY ESLint)
- **MUST** use consistent type imports with `type` keyword (ENFORCED BY ESLint)

## File Organization Standards

### Component Structure (MANDATORY)

```
components/
└── feature-name/
    ├── index.ts          // Named exports only
    ├── FeatureName.tsx   // PascalCase component
    ├── types.ts          // TypeScript interfaces
    ├── constants.ts      // UPPER_CASE constants
    ├── styles.ts         // Tailwind CSS custom utilities and component styles
    └── FeatureName.test.tsx
```

### Naming Conventions (ENFORCED)

- **Files/Folders**: `kebab-case` (feature-name/)
- **Components/Types**: `PascalCase` (UserProfile, UserProfileProps)
- **Variables/Functions**: `camelCase` (userName, calculateTotal)
- **Constants**: `UPPER_SNAKE_CASE` (MAX_RETRY_COUNT)
- **Hooks**: `camelCase` starting with `use` (useUserData)

## Design System Integration

### shadcn/ui Component Usage (ENFORCED)

- **MUST** use shadcn/ui components before creating custom components (ENFORCED BY code review)
- **MUST** use Tailwind CSS utility classes for styling (REQUIRED)
- **MUST** follow shadcn/ui component patterns and conventions exactly (NO EXCEPTIONS)
- **ABSOLUTELY FORBIDDEN** to create custom UI components when shadcn/ui equivalents exist (BLOCKED by architecture review)


### Styling Approach (ENFORCED HIERARCHY)

1. **FIRST**: Use shadcn/ui components with built-in variants (ALWAYS)
2. **SECOND**: Use Tailwind CSS utility classes for styling (REQUIRED)
3. **THIRD**: Use Tailwind CSS theme configuration and custom design tokens (WHEN NEEDED)
4. **FOURTH**: Use CSS variables (defined in globals.css) for complex theming (WHEN NEEDED)
5. **ABSOLUTELY FORBIDDEN**: Inline styles or arbitrary CSS values outside Tailwind (BLOCKED BY ESLINT)


## Data Access (ENFORCED BY CODE REVIEW)

### Data Source Selection (MANDATORY)

- **REQUIRED** use TanStack Query for all external API calls (REST endpoints)
- **FORBIDDEN** mixing data access methods for same data source
- **REQUIRED** follow structured file organization patterns for all data access

### Method-Specific Standards (ENFORCED BY DOMAIN FILES)

**REST API (Primary Data Source)**:

- **MUST** use TanStack Query with structured file organization
- **REQUIRED** follow `data-access/query/{domain}/` pattern
- **MANDATORY** consistent constants, service, schema, hooks structure
- **REQUIRED** custom hooks for all API operations
- **MUST** implement proper error handling and loading states

## Component Development

### Functional Components

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const UserProfile = ({ user, onEdit }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    onEdit?.();
  }, [onEdit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={handleEdit}>Edit</Button>
      </CardContent>
    </Card>
  );
};
```

### Performance

- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Use Zustand shallow selectors: `useShallow((state) => ({ ... }))`

## Testing

- Write unit tests for all components
- Create isolated query clients for TanStack Query tests
- Test loading, error, and success states for all API calls
- Mock API responses using MSW (Mock Service Worker)
- Test custom hooks with React Testing Library

**Reference**: `@.agent-os/standards/testing/patterns.md`

## Error Handling

### Error Boundaries

```typescript
<ErrorBoundary fallback={<ErrorDisplay />}>
  <FeatureComponent />
</ErrorBoundary>
```

### Query Errors

```typescript
// TanStack Query - API Data
const { data, isLoading, error, isError } = useQuery({
  queryKey: ['products', id],
  queryFn: () => fetchProduct(id),
  retry: 3,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

if (isLoading) return <LoadingComponent />;
if (isError) return <ErrorComponent error={error} />;

// TanStack Query - Native Data
const { data, isLoading, error } = useQuery({
  queryKey: ['nativeRepositories', 'plan'],
  queryFn: fetchPlanRepository,
});
```

## Anti-Patterns

### Forbidden

- Custom UI components when shadcn/ui equivalents exist
- Inline styles or hardcoded CSS values
- Default exports (use named exports)
- Function declarations (use arrow functions)
- `var` (use `const`/`let`)
- **Using direct fetch/axios when TanStack Query should be used**
- **Not implementing proper error handling for API calls**
- **Mixing data fetching libraries (stick to TanStack Query)**

## Code Style

**Reference**: `@.agent-os/standards/code-style.md`

### Import Organization (ENFORCED)

- **MUST** follow ESLint `import/order` configuration defined in `.eslintrc.js` (BLOCKED BY PRE-COMMIT HOOKS)
- **REQUIRED** import order: External → Internal (alphabetical pathGroups) → Parent → Sibling → Index with newlines between groups (FAILS CI BUILD IF VIOLATED)
- **ABSOLUTELY FORBIDDEN** to deviate from configured import order (NO EXCEPTIONS)

### File Conventions (MANDATORY)

- Use `.tsx` for React components, `.ts` for utilities
- Arrow functions exclusively: `const func = () => {}`
- Named exports only: `export const Component = () => {}`

## Dependencies

**Reference**: `@.agent-os/standards/tech-stack.md`

- **UI**: shadcn/ui with Tailwind CSS
- **State**: Zustand 5.0.3 with shallow selectors
- **API Data**: TanStack Query 5.59.16
- **HTTP Client**: sindresorhus/ky for API requests
- **Native Bridge**: TanStack Query 5.59.16
- **TypeScript**: 5.1.6 strict mode

## Package Management (ABSOLUTE ENFORCEMENT)

### pnpm Usage (MANDATORY)

- **MUST** use `pnpm` exclusively for ALL package management operations (ENFORCED BY CI/TOOLING/REVIEW)
- **MUST** use `pnpm run` for ALL script execution (ENFORCED BY PRE-COMMIT HOOKS)
- **ABSOLUTELY FORBIDDEN** to use `npm` or `yarn` commands in any context (BLOCKS CI BUILD)
- **MANDATORY** for AI assistants, developers, documentation, and examples (NO EXCEPTIONS)

**REQUIRED COMMANDS:**

- Package installation: `pnpm install` (NEVER `npm install` or `yarn install`)
- Script execution: `pnpm run <script>` or `pnpm <script>` (NEVER `npm run` or `yarn run`)
- Package addition: `pnpm add <package>` (NEVER `npm install <package>` or `yarn add`)
- Dev dependencies: `pnpm add -D <package>` (NEVER `npm install --save-dev` or `yarn add -D`)

**ENFORCEMENT MECHANISMS:**

- **CI BUILD FAILURE**: Any `npm` or `yarn` usage detected in PRs will fail CI
- **PRE-COMMIT HOOKS**: Block commits containing `npm` or `yarn` commands
- **CODE REVIEW BLOCKING**: PRs with `npm` or `yarn` usage will be rejected
- **AUTOMATED DETECTION**: Linting rules scan for `npm` or `yarn` usage in documentation and scripts

## Workflow

Run `pnpm prettier` after adding new `.ts` or `.tsx` files.

## Native Development

**Reference**: `@.agent-os/standards/native/development.md`
