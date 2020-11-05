// @ts-check

'use strict';

const webpack = require('webpack');
const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const tsLoader = {
	test: /\.ts$/,
	exclude: /node_modules/,
	use: [{
		loader: 'ts-loader',
		options: {
			configFile: 'media/tsconfig.json',
			transpileOnly: true,
			appendTsSuffixTo: [/\.vue$/],
		},
	}],
};
const vueLoader = {
	test: /\.vue$/,
	loader: 'vue-loader',
	options: {
		optimizeSSR: false,
	},
};
const sassLoader = {
	test: /\.s?css$/i,
	use: [
		'vue-style-loader',
		'css-loader',
		'sass-loader',
	],
};

module.exports = (env, options) => {
	/** @type {import('webpack').Configuration}*/
	const config = {
		target: 'web',

		entry: './media/index.ts',
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
		resolve: {
			extensions: ['.ts', '.js', '.vue', '.css', '.scss', '.json'],
			alias: {
				src: path.resolve('./src'),
				vue$: 'vue/dist/vue.esm.js',
			},
		},
		module: {
			rules: [
				tsLoader,
				vueLoader,
				sassLoader,
			],
		},
		plugins: [
			new VueLoaderPlugin(),
			new FriendlyErrorsWebpackPlugin(),
		],
	};

	if (options.mode === 'production') {
		// Prod
	} else {
		// Dev
		// config.module.rules[0] = tsLoader;
	}

	return config;
};
