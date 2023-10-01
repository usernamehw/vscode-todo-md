import { commands, ConfigurationTarget, env, Position, Range, TextDocument, Uri, window, workspace } from 'vscode';
import { Link } from '../TheTask';

/**
 * Create new untitled file with provided content and language;
 */
export async function openInUntitled(content: string, language?: string): Promise<void> {
	const document = await workspace.openTextDocument({
		language,
		content,
	});
	window.showTextDocument(document);
}
/**
 * Given only start and end lines - get the full Range (with characters).
 */
export function getFullRangeFromLines(document: TextDocument, lineStart: number, lineEnd: number): Range {
	const lineAtTheEnd = document.lineAt(lineEnd);
	return new Range(lineStart, 0, lineEnd, lineAtTheEnd.range.end.character);
}
/**
 * Open URL in default browser. If multiple links then show quick pick.
 */
export async function followLinks(links: Link[]) {
	let link: string | undefined = links[0].value;
	if (links.length > 1) {
		link = await window.showQuickPick(links.map(l => l.value));
		if (!link) {
			return;
		}
	}
	followLink(link);
}
/**
 * Opens a link externally using the default application.
 */
export async function followLink(linkString: string) {
	const enum Prefixes {
		File = 'file:///',
		AppFromWebview = 'app:///',
		AppFromLinks = 'app:',
		Command = 'command:',
	}

	try {
		if (linkString.startsWith(Prefixes.File)) {
			return await openFileInEditor(linkString);
		} else if (linkString.startsWith(Prefixes.AppFromWebview)) {
			return await env.openExternal(Uri.parse(linkString.slice(Prefixes.AppFromWebview.length)));
		} else if (linkString.startsWith(Prefixes.AppFromLinks)) {
			return await env.openExternal(Uri.parse(linkString.slice(Prefixes.AppFromLinks.length)));
		} else if (linkString.startsWith(Prefixes.Command)) {
			const commandString = linkString.slice(Prefixes.Command.length);
			const commandParts = commandString.split('?');
			const commandId = commandParts[0];
			const argsPart = commandParts[1];
			const args = argsPart ? JSON.parse(decodeURIComponent(argsPart)) : undefined;
			commands.executeCommand(commandId, args);
		} else {
			return await env.openExternal(Uri.parse(linkString));
		}
	} catch (e) {
		window.showErrorMessage((e as Error).message);
	}
}
/**
 * Open file by absolute path in the editor tab.
 */
export async function openFileInEditor(filePath: string): Promise<void> {
	// handle vscode file protocol paths too
	if (filePath.startsWith('file:///')) {
		filePath = Uri.parse(filePath).fsPath;
	}
	const document = await workspace.openTextDocument(filePath);
	await window.showTextDocument(document);
}
/**
 * Open vscode Settings GUI with input value set to the specified value.
 */
export function openSettingsGuiAt(settingName: string) {
	commands.executeCommand('workbench.action.openSettings', settingName);
}
/**
 * Vscode input has a noisy propmt.
 * This function makes some space between text and the prompt
 * by using several non-breaking spaces.
 */
export function inputOffset(text: string): string {
	return `${text}${' '.repeat(8)}`;
}
/**
 * Get word range, but using regexp defining word as a thing surrounded by spaces
 */
export function getWordRangeAtPosition(document: TextDocument, position: Position) {
	return document.getWordRangeAtPosition(position, /\S+/);
}
/**
 * Get a word at position (word delimiter is a whitespace)
 */
export function getWordAtPosition(document: TextDocument, position: Position) {
	const wordRange = getWordRangeAtPosition(document, position);
	if (wordRange) {
		return document.getText(wordRange);
	}
	return undefined;
}
/**
 * Updates global setting with new value.
 */
export async function updateSetting(settingName: string, newValue: unknown) {
	const settings = workspace.getConfiguration(undefined, null);
	return settings.update(settingName, newValue, ConfigurationTarget.Global);
}
/**
 * Toggle global setting (cycle through passed values).
 */
export async function toggleGlobalSetting(settingName: string, values: unknown[]) {
	const settings = workspace.getConfiguration(undefined, null);
	const currentSettingValue = settings.get(settingName);

	if (values.length === 1) {
		return settings.update(settingName, values[0], ConfigurationTarget.Global);
	} else {
		const next = getNextOrFirstElement(values, currentSettingValue);
		return settings.update(settingName, next, ConfigurationTarget.Global);
	}
}
/**
 * Get next item from array. If at the end - return first element.
 */
function getNextOrFirstElement<T>(arr: T[], target: any): T {
	const idx = arr.findIndex(el => el === target);
	return idx === arr.length - 1 ? arr[0] : arr[idx + 1];
}
/**
 * Transform inline svg to {@link Uri}
 */
export function svgToUri(svg: string): Uri {
	return Uri.parse(`data:image/svg+xml;utf8,${svg}`);
}
/**
 * Calculate editor line height (in px).
 */
export function getEditorLineHeight(): number {
	const config = workspace.getConfiguration();
	const fontSize = config.get<number>('editor.fontSize')!;
	const lineHeightVscode = config.get<number>('editor.lineHeight')!;
	const lineHeight = lineHeightVscode <= 8 ? fontSize * lineHeightVscode : lineHeightVscode;
	return Math.round(lineHeight);
}
