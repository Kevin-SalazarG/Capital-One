const config = {
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts"],
  coverageDirectory: "<rootDir>/coverage",
  clearMocks: true,
  restoreMocks: true,
};

module.exports = config;
