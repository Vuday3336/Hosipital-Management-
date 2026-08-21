module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  testMatch: ["<rootDir>/tests/**/*.test.{js,jsx}"],
};
