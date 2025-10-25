# TypeScript Patterns

## Core TypeScript Rules (ENFORCED)

### File Extensions (MANDATORY)

- **MUST** use `.ts` for TypeScript files
- **MUST** use `.tsx` for TypeScript React components
- **MUST NOT** use `.js` or `.jsx` extensions (ESLint enforced)

### Variable Declarations (REQUIRED)

```typescript
// ✅ REQUIRED
const config = { api: 'https://api.example.com' }; // Immutable
let count = 0; // Mutable
const userId = 'user-123'; // Min 3 chars (exceptions: id, z, _)

// ❌ FORBIDDEN
var config = {}; // Never use var
const u = user; // Too short variable names
const p = props; // Too short variable names
```

### Function Declarations (MANDATORY)

```typescript
// ✅ REQUIRED - Arrow functions only
const calculateTotal = (items: Item[]) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

const processUserData = async (userData: UserData) => {
  const validated = validateUserData(userData);
  return await saveUserData(validated);
};

// ❌ FORBIDDEN - Function declarations
function calculateTotal(items: Item[]) {} // Never use
function processUserData() {} // Never use
const helper = function () {}; // Never use
```

### Type Safety (ENFORCED)

```typescript
// ✅ REQUIRED - Explicit typing
type UserData = {
  id: string;
  name: string;
  email: string;
};

const processUser = (user: UserData): Promise<ProcessedUser> => {
  return Promise.resolve({ ...user, processed: true });
};

// Use proper type imports
import type { User, UserProps } from './types';

// ❌ FORBIDDEN - Any type usage
const processUser = (user: any): any => {}; // Never use any
const data = response as any; // Never use any casting
```

### Object and Array Patterns (REQUIRED)

```typescript
// ✅ REQUIRED - Destructuring patterns
const { name, email, id } = user;
const [first, second, ...rest] = items;

// Object spread for immutable updates
const updatedUser = { ...user, lastLogin: new Date() };
const updatedItems = [...items, newItem];

// Proper optional chaining
const userName = user?.profile?.name ?? 'Unknown';
const hasItems = items?.length > 0;

// ❌ FORBIDDEN - Mutation patterns
user.lastLogin = new Date(); // Use spread operator
items.push(newItem); // Use spread operator
const userName = user && user.profile && user.profile.name; // Use optional chaining
```

### Async/Await Patterns (MANDATORY)

```typescript
// ✅ REQUIRED - Async/await with proper error handling
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const response = await apiClient.getUser(userId);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};

// Promise chains only when necessary
const processUsers = async (userIds: string[]) => {
  const users = await Promise.all(userIds.map((id) => fetchUserData(id)));
  return users.filter(Boolean);
};

// ❌ FORBIDDEN - Promise chains and callback patterns
fetchUserData(userId)
  .then((data) => processData(data))
  .then((result) => handleResult(result))
  .catch((error) => handleError(error)); // Use async/await

// Never use callbacks when Promises available
getUserData(userId, (error, data) => {}); // Use Promise-based APIs
```

### Error Handling Patterns (REQUIRED)

```typescript
// ✅ REQUIRED - Proper error handling
const safeOperation = async (data: unknown): Promise<Result> => {
  try {
    const validated = validateData(data);
    const processed = await processData(validated);
    return { success: true, data: processed };
  } catch (error) {
    console.error('Operation failed:', error);
    return { success: false, error: error.message };
  }
};

// Type-safe error handling
const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
};

// ❌ FORBIDDEN - Silent failures
const unsafeOperation = async (data: unknown) => {
  try {
    await processData(data);
  } catch {
    // Silent failure - never do this
  }
};
```

### Module Patterns (ENFORCED)

```typescript
// ✅ REQUIRED - Named exports only
export const UserService = {
  createUser: (userData: UserData) => {},
  updateUser: (id: string, updates: Partial<UserData>) => {},
  deleteUser: (id: string) => {},
};

export const validateUserData = (data: unknown): UserData => {};
export type { UserData, ProcessedUser } from './types';

// ❌ FORBIDDEN - Default exports
export default UserService; // Never use default exports
export default function validateUserData() {} // Never use default exports
```

### Utility Patterns (REQUIRED)

```typescript
// ✅ REQUIRED - Type-safe utilities
const isNonEmpty = <T>(array: T[]): array is [T, ...T[]] => array.length > 0;

const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    result[key] = obj[key];
  });
  return result;
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// ❌ FORBIDDEN - Untyped utilities
const pick = (obj, keys) => {}; // Missing types
const debounce = (func, delay) => {}; // Missing types
```

## Performance Patterns (MANDATORY)

### Memory Management

```typescript
// ✅ REQUIRED - Proper cleanup
const useEventListener = (event: string, handler: EventHandler) => {
  useEffect(() => {
    const cleanup = addEventListener(event, handler);
    return cleanup; // Always return cleanup function
  }, [event, handler]);
};

// Avoid memory leaks in closures
const createHandler = (userId: string) => {
  return useCallback(() => {
    processUser(userId);
  }, [userId]); // Include dependencies
};

// ❌ FORBIDDEN - Memory leaks
useEffect(() => {
  const interval = setInterval(updateData, 1000);
  // Missing cleanup - memory leak
}, []);
```

### Optimization Patterns

```typescript
// ✅ REQUIRED - Memoization
const expensiveCalculation = useMemo(() => {
  return complexCalculation(data);
}, [data]);

const optimizedCallback = useCallback(
  (id: string) => {
    onItemSelect(id);
  },
  [onItemSelect]
);

// Lazy initialization
const [state, setState] = useState(() => {
  return computeInitialState(props);
});

// ❌ FORBIDDEN - Unnecessary re-calculations
const result = complexCalculation(data); // Runs on every render
const handleClick = () => onItemSelect(id); // New function on every render
```
