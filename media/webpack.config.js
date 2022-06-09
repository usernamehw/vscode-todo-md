// @ts-check

const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader')

const tsLoader = {
	test: /\.ts$/,
	exclude: /node_modules/,
	use: [{
		loader: 'ts-loader',
		options: {
			configFile: 'media/tsconfig.json',
			transpileOnly: false,
			appendTsSuffixTo: [/\.vue$/],
		},
	}],
};
const vueLoader = {
	test: /\.vue$/,
	loader: 'vue-loader',
	options: {
		isServerBuild: false,
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
		target: 'node',

		entry: './media/index.ts',
		output: {
			path: path.resolve(__dirname),
			filename: 'webview.js',
			libraryTarget: 'window',
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
				// vue$: 'vue/dist/vue.esm.js',
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
			// @ts-ignore
			new VueLoaderPlugin(),
			// @ts-ignore
			new FriendlyErrorsWebpackPlugin(),
		],
	};

	if (options.mode === 'production') {
		// Prod
		// @ts-ignore
		// config.optimization = {
		// 	minimize: true,
		// 	minimizer: [
		// 		// @ts-ignore
		// 		new TerserPlugin({
		// 			terserOptions: {
		// 				ecma: 2020,
		// 				toplevel: true,
		// 				// @ts-ignore
		// 				format: {
		// 					comments: false,// Opt out of LICENSE.txt creation
		// 				},
		// 			},
		// 			extractComments: false,
		// 		}),
		// 	],
		// }
	} else {
		// Dev
	}

	return config;
};
