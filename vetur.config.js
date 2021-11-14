/** @type {import('vls').VeturConfig} */
module.exports = {
	// **optional** default: `{}`
	// override vscode settings part
	// Notice: It only affects the settings used by Vetur.
	settings: {
		"vetur.useWorkspaceDependencies": true,
		"vetur.experimental.templateInterpolationService": true
	},
	// **optional** default: `[{ root: './' }]`
	// support monorepos
	projects: [
		"./media",
		{
			// **required**
			// Where is your project?
			// It is relative to `vetur.config.js`.
			root: './app',
			// **optional** default: `'package.json'`
			// Where is `package.json` in the project?
			// We use it to determine the version of vue.
			// It is relative to root property.
			package: '../package.json',
			// **optional**
			// Where is TypeScript config file in the project?
			// It is relative to root property.
			tsconfig: './tsconfig.json',
		}
	]
}