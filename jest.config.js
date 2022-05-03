// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
	verbose: true,
	transform: {
		"^.+\\.tsx?$": [
			"esbuild-jest",
			{
				sourcemap: true,
				loaders: {
					".spec.ts": "tsx",
				},
			},
		],
	},
};

module.exports = config;
