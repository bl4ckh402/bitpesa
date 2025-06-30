# Using GSAP Cleanup Utilities in BitPesa

This tutorial shows how to properly clean up GSAP animations when navigating between pages in BitPesa's Next.js application.

## 1. Import the Required Utilities

First, import the GSAP cleanup utilities in your component:

```tsx
import { useGSAPContext, useGSAPCleanup, useMultiGSAPContexts } from "@/lib/gsap-cleanup";
```

## 2. Basic Cleanup (Simplest Option)

For simple components, just add the hook and all animations will be cleaned up automatically:

```tsx
function MyComponent() {
  useGSAPCleanup();
  
  // Your animations...
}
```

## 3. Using GSAP Context (Recommended)

For better control and organization, use the GSAP context:

```tsx
function MyComponent() {
  const { createContext } = useGSAPContext();
  
  useEffect(() => {
    const ctx = createContext((self) => {
      // All GSAP animations created here will be automatically cleaned up
      const tl = gsap.timeline();
      
      tl.to('.element', { opacity: 1, duration: 1 });
      tl.to('.another-element', { y: 0, duration: 1 }, '-=0.5');
      
      // Return the timeline if needed later
      return tl;
    }, myElementRef.current);
    
    // No need for manual cleanup in the return function!
  }, [createContext]); // Important: include createContext in dependencies
  
  return <div ref={myElementRef}>...</div>;
}
```

## 4. Example with ScrollTrigger

ScrollTrigger animations are automatically cleaned up when using contexts:

```tsx
function ScrollAnimation() {
  const containerRef = useRef(null);
  const { createContext } = useGSAPContext();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = createContext((self) => {
      gsap.registerPlugin(ScrollTrigger);
      
      ScrollTrigger.batch(".scroll-items", {
        onEnter: batch => gsap.to(batch, { 
          opacity: 1, 
          y: 0,
          stagger: 0.1, 
          duration: 0.6
        }),
        start: "top bottom-=100",
        once: true
      });
    }, containerRef.current);
    
    // No cleanup needed here - handled by context
  }, [createContext]);
  
  return (
    <div ref={containerRef}>
      {items.map(item => (
        <div className="scroll-items" key={item.id}>
          {/* Content */}
        </div>
      ))}
    </div>
  );
}
```

## 5. Multiple Animation Sections

For complex pages with multiple animation sections:

```tsx
function ComplexPage() {
  const { createContext } = useMultiGSAPContexts();
  
  useEffect(() => {
    // Hero animations
    const heroCtx = createContext((self) => {
      // Hero animations...
    }, heroRef.current);
    
    // Features animations
    const featuresCtx = createContext((self) => {
      // Features animations...
    }, featuresRef.current);
    
    // All contexts are automatically cleaned up
  }, [createContext]);
}
```

## 6. Cleanup in Pages That Use GSAP

Always add the `useGSAPCleanup` hook to any page that uses GSAP animations:

```tsx
export default function PageWithAnimations() {
  // Add this to ensure cleanup when navigating away
  useGSAPCleanup();
  
  // Rest of your page...
}
