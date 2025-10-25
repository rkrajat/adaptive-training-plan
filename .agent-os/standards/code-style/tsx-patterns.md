# React TSX Patterns

## Component Structure (MANDATORY)

### Basic Component Pattern

```typescript
import React from 'react';
import { Button } from '@chakra-ui/react';
import { Box, Card, CardBody, CardHeader, Heading, VStack } from '@chakra-ui/react';

import type { ComponentProps } from './types';

export const ExampleComponent = ({
  title,
  onClick,
  variant = 'default'
}: ComponentProps) => {
  return (
    <Card>
      <CardHeader>
        <Heading>
          {title}
        </Heading>
      </CardHeader>
      <CardBody>
        <Button
          variant={variant}
          onClick={onClick}>
          Click Me
        </Button>
      </CardBody>
    </Card>
  );
};
```

### Component with Chakra UI Styling

```typescript
import React from 'react';
import { Button } from '@chakra-ui/react';
import { Box, Card, CardBody, CardHeader, Heading, VStack } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';

import type { ComponentProps } from './types';

export const CustomComponent = ({
  title,
  onClick,
  variant = 'default',
  className
}: ComponentProps) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <Heading className="text-xl font-semibold">
          {title}
        </Heading>
      </CardHeader>
      <CardBody>
        <Button
          variant={variant}
          onClick={onClick}
          className="w-full">
          Click Me
        </Button>
      </CardBody>
    </Card>
  );
};
```

## JSX Formatting Rules (ENFORCED)

### Prop Formatting

```typescript
// ✅ REQUIRED - Multiple props on separate lines
<Button
  variant="default"
  size="lg"
  disabled={isLoading}
  onClick={handleClick}
  className="w-full">
  Submit
</Button>

// ✅ REQUIRED - Single prop on same line
<h1 className="text-2xl font-bold">Title</h1>

// ✅ REQUIRED - Explicit boolean props
<Button disabled={true} loading={false} />

// ❌ FORBIDDEN - Implicit boolean props
<Button disabled loading /> // Use explicit values
```

### Conditional Rendering

```typescript
// ✅ REQUIRED - Ternary for inline conditions
{isLoading ? <LoadingSpinner /> : <Content />}

// ✅ REQUIRED - Logical AND for show/hide
{hasData && <DataDisplay data={data} />}

// ✅ REQUIRED - Early returns for complex conditions
if (isError) {
  return <ErrorMessage error={error} />;
}

if (isLoading) {
  return <LoadingSpinner />;
}

return <MainContent />;

// ❌ FORBIDDEN - Nested ternaries
{isLoading ? <LoadingSpinner /> : isError ? <ErrorMessage /> : <Content />}
```

### List Rendering

```typescript
// ✅ REQUIRED - Proper key usage for small lists
{items.map((item) => (
  <ItemCard
    key={item.id}
    item={item}
    onClick={handleItemClick}
  />
))}

// ✅ REQUIRED - Virtual scrolling for large lists (1000+ items)
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedList = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated item height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemCard
              item={items[virtualItem.index]}
              onClick={handleItemClick}
              className="border rounded-lg p-4 hover:bg-muted/50"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ REQUIRED - Intersection Observer for infinite scroll
const InfiniteScrollList = ({ items, loadMore, hasMore }: InfiniteScrollProps) => {
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onClick={handleItemClick} />
      ))}
      {hasMore && (
        <div ref={ref} className="flex justify-center p-4">
          <Spinner />
        </div>
      )}
    </div>
  );
};

// ❌ FORBIDDEN - Index as key
{items.map((item, index) => (
  <ItemCard key={index} item={item} /> // Use item.id
))}

// ❌ FORBIDDEN - Rendering large lists without optimization
{largeItemArray.map((item) => ( // Use virtualization for 1000+ items
  <ItemCard key={item.id} item={item} />
))}
```

### Event Handling

```typescript
// ✅ REQUIRED - useCallback for event handlers
const handleClick = useCallback(() => {
  onItemSelect(item.id);
}, [onItemSelect, item.id]);

const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setInputValue(value);
  onTextChange?.(value);
}, [onTextChange]);

// ✅ REQUIRED - Inline handlers for simple cases
<Button onClick={() => setIsVisible(false)}>
  Close
</Button>

// ❌ FORBIDDEN - Complex inline handlers
<Button onClick={() => {
  // Multiple lines of logic
  validateInput();
  processData();
  updateState();
}}>
  Process
</Button>
```

## Web Specific Patterns (MANDATORY)

### Browser Environment Handling

```typescript
// ✅ REQUIRED - Client-side only code
const isClient = typeof window !== 'undefined';

// Environment-specific components
{isClient ? (
  <ClientOnlyComponent />
) : (
  <ServerSideComponent />
)}

// ✅ REQUIRED - Feature detection
const hasLocalStorage = typeof Storage !== 'undefined';
const supportsTouch = 'ontouchstart' in window;
```

### Responsive Design Patterns

```typescript
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const ResponsiveComponent = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  return (
    <div className={cn(
      'container mx-auto px-4',
      isMobile && 'px-2',
      isTablet && 'px-6'
    )}>
      <Content />
    </div>
  );
};
```

### Interactive Elements

```typescript
// ✅ REQUIRED - Button for simple interactions
<Button
  variant="default"
  onClick={handleClick}
  className="hover:bg-muted transition-colors">
  Simple Button
</Button>

// ✅ REQUIRED - Custom interactive elements
<div
  role="button"
  tabIndex={0}
  className={cn(
    'cursor-pointer rounded-md p-2 transition-colors',
    'hover:bg-muted focus:ring-2 focus:ring-primary'
  )}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
  Custom Interactive Element
</div>
```

## Styling Integration (REQUIRED)

### Conditional Styling with Chakra UI

```typescript
import { useColorMode } from '@chakra-ui/react';

// ✅ REQUIRED - Conditional className with cn()
<div className={cn(
  'container mx-auto p-4',
  isActive && 'bg-primary text-primary-foreground',
  variant === 'large' && 'max-w-4xl'
)}>
  <Content />
</div>

// ✅ REQUIRED - Dynamic classes with shadcn/ui variants
<p className={cn(
  'text-base',
  variant === 'error' && 'text-destructive',
  isHighlighted && 'bg-yellow-100 dark:bg-yellow-900'
)}>
  {content}
</p>

// ❌ FORBIDDEN - Inline styles with hardcoded values
<div style={{
  backgroundColor: isActive ? '#3b82f6' : '#6b7280', // Use CSS variables
  padding: 16,
}}>
```

### Responsive Design with Tailwind

```typescript
// ✅ REQUIRED - Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <div
      key={item.id}
      className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
      <Content item={item} />
    </div>
  ))}
</div>

// ✅ REQUIRED - Container queries with modern CSS
<div className="@container">
  <div className="@sm:grid-cols-2 @lg:grid-cols-3 grid gap-4">
    <Content />
  </div>
</div>
```

## Performance Patterns (MANDATORY)

### Component Memoization

```typescript
// ✅ REQUIRED - React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  // Expensive rendering logic
  return <ComplexUI data={data} onUpdate={onUpdate} />;
});

// ✅ REQUIRED - Custom comparison function when needed
export const OptimizedComponent = React.memo(
  ({ items, selectedId }) => {
    return <ItemList items={items} selectedId={selectedId} />;
  },
  (prevProps, nextProps) => {
    return prevProps.selectedId === nextProps.selectedId &&
           prevProps.items.length === nextProps.items.length;
  }
);
```

### Image Optimization

```typescript
import Image from 'next/image'; // If using Next.js

// ✅ REQUIRED - Optimized images with Next.js
<Image
  src={imageUrl}
  alt="Description"
  width={400}
  height={300}
  className="rounded-lg object-cover"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  onError={handleImageError}
  onLoad={handleImageLoad}
/>

// ✅ REQUIRED - Standard img with optimization
<img
  src={imageUrl}
  alt="Description"
  className="w-full h-64 object-cover rounded-lg"
  loading="lazy"
  onError={handleImageError}
  onLoad={handleImageLoad}
/>
```

## Anti-Patterns (FORBIDDEN)

### ❌ React Native Elements in Web React

```typescript
// NEVER use React Native elements
<View>Content</View> // Use div or shadcn/ui components
<Text>Text</Text> // Use appropriate HTML elements or Typography
<TouchableOpacity>Click</TouchableOpacity> // Use Button or button
<FlatList data={items} /> // Use map() or virtualization libraries
```

### ❌ Inline Styles with Hardcoded Values

```typescript
// NEVER use hardcoded values
<div style={{
  backgroundColor: '#FF0000', // Use Chakra UI color tokens: bg="red.500"
  padding: '16px', // Use Chakra UI spacing: p={4}
  fontSize: '14px', // Use Chakra UI font sizes: fontSize="sm"
}}>
```

### ❌ Nested Inline Functions

```typescript
// NEVER create complex inline functions
{items.map((item, index) => {
  // Complex logic here - extract to separate function
  const processedItem = processItem(item);
  return <ItemComponent key={item.id} item={processedItem} />;
})}
```
