import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  // Exclude Playwright E2E tests from Jest
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/e2e/",
    "<rootDir>/src/__tests__/setup.ts", // setup file, not a test suite
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/layout.tsx", // Root layout — hard to unit test meaningfully
  ],

  // CI fails if coverage drops below these floors.
  // Raise the thresholds incrementally as the test suite matures —
  // never lower them. branches is lower because many branches are
  // in render paths that require integration-level tests to exercise.
  coverageThreshold: {
    global: {
      lines:     70,
      functions: 70,
      branches:  60,
      statements: 70,
    },
  },
};

export default createJestConfig(config);
