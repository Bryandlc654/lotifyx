import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^lucide-react$": "<rootDir>/__mocks__/lucide-react.tsx",
    "^next/link$": "<rootDir>/__mocks__/next-link.tsx",
  },
  setupFiles: ["<rootDir>/jest.setup.ts"],
};

export default createJestConfig(config);
