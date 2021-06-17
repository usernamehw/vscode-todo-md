import { commands, ConfigurationTarget, env, Position, Range, TextDocument, Uri, window, workspace } from 'vscode';
import { Link } from '../TheTask';
import { VscodeContext } from '../types';

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
 * Open file by absolute path in the editor(tab).
 */
export async function openFileInEditor(path: string) {
	const document = await workspace.openTextDocument(path);
	window.showTextDocument(document);
}
/**
 * Given only start and end lines - get the full Range with characters.
 */
export function getFullRangeFromLines(document: TextDocument, lineStart: number, lineEnd: number): Range {
	const lineAtTheEnd = document.lineAt(lineEnd);
	return new Range(lineStart, 0, lineEnd, lineAtTheEnd.range.end.character);
}
/**
 * Set vscode context.
 */
export async function setContext(context: VscodeContext, value: any) {
	return await commands.executeCommand('setContext', context, value);
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
	return await env.openExternal(Uri.parse(linkString));
}
export async function openFileInEditorByPath(path: string) {
	await openFileInEditor(Uri.parse(path).fsPath);
}
/**
 * Open vscode Settings GUI with input value set to the specified value.
 */
export function openSettingGuiAt(settingName: string) {
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
