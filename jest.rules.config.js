// Security rules tests run in plain Node against the Firestore emulator.
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/firestore-tests/**/*.test.js"],
  transform: {},
};
