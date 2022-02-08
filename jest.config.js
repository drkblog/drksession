module.exports = {
  testEnvironment: "miniflare",
  testEnvironmentOptions: {
    bindings: { 
      TIKTOK_API_CLIENT_KEY: "tiktok-key",
      TIKTOK_API_CLIENT_SECRET: "tiktok-secret"
    },
    kvNamespaces: ["DRK_SESSION"]
  },
  "transform": {
    "^.+\\.(t|j)sx?$": "ts-jest"
  },
  "testRegex": "/test/.*\\.test\\.ts$",
  "collectCoverageFrom": ["src/**/*.{ts,js}"],
  "preset": "ts-jest"
};