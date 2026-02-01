import '@testing-library/jest-dom/vitest';

// Only apply DOM mocks when running in jsdom environment
if (typeof Element !== 'undefined') {
  // Mock scrollIntoView for Radix UI components
  Element.prototype.scrollIntoView = () => {};

  // Mock hasPointerCapture for Radix UI
  Element.prototype.hasPointerCapture = () => false;
}

// Mock ResizeObserver (needed for Radix UI in jsdom)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock matchMedia for reduced motion detection
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}
