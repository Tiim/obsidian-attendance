// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
	verbose: true,
	preset: "ts-jest",
	testEnvironment: "jsdom",
	moduleDirectories: ["node_modules", "src"],
};

module.exports = config;
