import { ColorThemeKind, window } from 'vscode';

const colors = {
	favorite: {
		light: '#ff1493',
		dark: '#ff1493',
	},
	due: {
		light: '#01c208',
		dark: '#35c03a',
	},
	overdue: {
		light: '#d44343',
		dark: '#f64f4f',
	},
	notDue: {
		light: '#7e8081',
		dark: '#afafaf',
	},
	invalid: {
		light: '#7284eb',
		dark: '#7284eb',
	},
	today: {
		light: '#7284eb',
		dark: '#7284eb',
	},
} satisfies Record<string, {light: string; dark: string}>;

/**
 * Get color ,ideally, depending on theme light/dark.
 */
export function helpGetColor(colorName: keyof typeof colors) {
	return window.activeColorTheme.kind === ColorThemeKind.Dark ? colors[colorName].dark : colors[colorName].light;
}
