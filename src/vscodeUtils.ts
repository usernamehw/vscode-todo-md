import vscode, { Uri } from 'vscode';
import { VscodeContext } from './types';

/**
 * Create new untitled file with provided content and language;
 */
export async function openInUntitled(content: string, language?: string): Promise<void> {
	const document = await vscode.workspace.openTextDocument({
		language,
		content,
	});
	vscode.window.showTextDocument(document);
}
/**
 * Open file by absolute path in the editor.
 */
export async function openFileInEditor(path: string) {
	const document = await vscode.workspace.openTextDocument(path);
	vscode.window.showTextDocument(document);
}
/**
 * Given only start and end lines - get the full Range with characters.
 */
export function getFullRangeFromLines(document: vscode.TextDocument, lineStart: number, lineEnd: number): vscode.Range {
	const lineAtTheEnd = document.lineAt(lineEnd);
	return new vscode.Range(lineStart, 0, lineEnd, lineAtTheEnd.range.end.character);
}
/**
 * Set vscode context.
 */
export function setContext(context: VscodeContext, value: any) {
	vscode.commands.executeCommand('setContext', context, value);
}
/**
 * Open URL in default browser.
 */
export function followLink(link: string) {
	vscode.env.openExternal(Uri.parse(link));
}
/**
 * Open vscode Settings GUI with input value set to the specified value.
 */
export function openSettingGuiAt(settingName: string) {
	vscode.commands.executeCommand('workbench.action.openSettings', settingName);
}
/**
 * Vscode input has a noisy propmt.
 * This function makes some space between text and the prompt
 * by using several non-breaking spaces.
 */
export function inputOffset(text: string): string {
	return `${text}${' '.repeat(8)}`;
}
