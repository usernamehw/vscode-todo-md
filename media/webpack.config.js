// @ts-check

'use strict';

const webpack = require('webpack');
const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

module.exports = (env, options) => {
	/** @type {import('webpack').Configuration}*/
	const config = {
		target: 'node',

		entry: './media/main.ts',
		output: {
			path: path.resolve(__dirname),
			filename: 'webview.js',
			libraryTarget: 'var',
			devtoolModuleFilenameTemplate: '../[resource-path]',
		},
		devtool: 'source-map',
		externals: {
			vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		},
		resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
			extensions: ['.ts', '.js'],
			alias: {
				src: path.resolve('./src'),
			},
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					exclude: /node_modules/,
					use: [{
						loader: 'ts-loader',
						options: {
							configFile: "media/tsconfig.json",
							transpileOnly: true,
						}
					}],
				},
			],
		},
		plugins: [
			new FriendlyErrorsWebpackPlugin(),
		],
	};

	if (options.mode === 'production') {
		// Prod
	} else {
		// Dev
		config.module.rules[0] = {
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					configFile: "media/tsconfig.json",
					transpileOnly: true,
				}
			}],
		};
	}

	return config;
};
