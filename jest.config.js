module.exports = {
  "transform": {
    "^.+\\.(t|j)sx?$": "ts-jest"
  },
  "testRegex": "/test/.*\\.test\\.ts$",
  "collectCoverageFrom": ["src/**/*.{ts,js}"],
  "preset": "ts-jest"
};