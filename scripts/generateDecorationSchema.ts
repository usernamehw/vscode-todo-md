import * as fs from 'fs';
import * as https from 'https';
import { resolve } from 'path';
import * as TJS from 'typescript-json-schema';


// Fetch the latest definitions
const file = fs.createWriteStream('vscode.d.ts');
https.get('https://raw.githubusercontent.com/Microsoft/vscode/master/src/vs/vscode.d.ts', response => {
	response.pipe(file);
	file.on('close', generateSchema);
});

function generateSchema() {
	const settings: TJS.PartialArgs = {
		ref: false, // No support of `$ref`/`definitions` in vscode contributed settings
		ignoreErrors: true,
	};
	const compilerOptions: TJS.CompilerOptions = {
		strictNullChecks: true,
	};
	const program = TJS.getProgramFromFiles([resolve('vscode.d.ts')], compilerOptions);
	const generator = TJS.buildGenerator(program, settings);

	if (!generator) {
		console.log('💔 Something went wrong, `generator` === null');
		return;
	}
	const usefulDescriptions = ['light', 'dark', 'before', 'after', 'rangeBehavior', 'isWholeLine', 'gutterIconPath', 'gutterIconSize', 'contentText', 'contentIconPath'];

	const rangeBehaviorDescriptions = ['OpenOpen', 'ClosedClosed', 'OpenClosed', 'ClosedOpen'];
	const overviewRulerLaneDescriptions = {
		1: 'Left',
		2: 'Center',
		4: 'Right',
		7: 'Full',
	};
	const decoration = generator.getSchemaForSymbol('DecorationRenderOptions');
	delete decoration.$schema;

	forEachRecursive(decoration, (item: any, parentKey: string) => {
		if (isObject(item) && item.description) {
			// Most of the descriptions are garbage: `CSS styling property that will be applied to text enclosed by a decoration.`
			if (!usefulDescriptions.includes(parentKey)) {
				delete item.description;
			}
			// EnumDescriptions is not a standard json schema and cannot be generated
			if (parentKey === 'rangeBehavior') {
				const enums = item.enum as string[];
				item.enumDescriptions = enums.map((e: any) => rangeBehaviorDescriptions[e]);
			} else if (parentKey === 'overviewRulerLane') {
				const enums = item.enum as string[];
				// @ts-ignore
				item.enumDescriptions = enums.map((e: any) => overviewRulerLaneDescriptions[e]);
			}
		}
	});

	const result: any = {};
	const supportedAdvancedColors = [
		"project",
		"context",
		"comment",
		"notDue",
		"due",
		"overdue",
		"invalidDue"
	];
	const defaultObj = {};
	for (const color of supportedAdvancedColors) {
		defaultObj[color] = {};
	}
	result['todomd.decorations'] = {
		type: 'object',
		description: 'Advanced decoration tweaking.',
		propertyNames: {
			enum: supportedAdvancedColors
		},
		default: defaultObj,
		patternProperties: {
			[`^(${supportedAdvancedColors.join('|')})$`]: {
				type: 'object',
				properties: {
					...decoration.properties,
				},
			},
		},
		additionalProperties: false,
	};

	fs.writeFileSync('./generated.json', JSON.stringify(result, undefined, '\t'), 'utf8');
}
// ================================================================================
function forEachRecursive(items: any, func: any, parentKey?: string) {
	if (Array.isArray(items)) {
		for (const item of items) {
			forEachRecursive(item, func, parentKey);
		}
	} else if (isObject(items)) {
		for (const key in items) {
			// `anyOf` choice is irrelevant and will confuse the users by suggesting passing objects (Uri, ThemeColor)
			if (key === 'anyOf') {
				delete items.anyOf;
				items.type = 'string';
			}
			if (['backgroundColor', 'color', 'outlineColor', 'borderColor', 'overviewRulerColor'].includes(key)) {
				items[key].format = 'color';
			}
			forEachRecursive(items[key], func, key);
		}
		func(items, parentKey);
	}
}
function isObject(item: any) {
	return typeof item === 'object' && item !== null;
}
