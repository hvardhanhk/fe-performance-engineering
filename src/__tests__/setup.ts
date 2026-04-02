import "@testing-library/jest-dom";

// Mock web-vitals — it's a browser library that doesn't work in jsdom
jest.mock("web-vitals", () => ({
  onLCP: jest.fn(),
  onCLS: jest.fn(),
  onINP: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));

// Mock Next.js navigation hooks used in NavActiveLink
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = class IntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  constructor() {}
} as unknown as typeof IntersectionObserver;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });
