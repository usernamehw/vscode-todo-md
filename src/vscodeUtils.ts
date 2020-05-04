import * as vscode from 'vscode';

export async function openInUntitled(content: string, language?: string): Promise<void> {
	const document = await vscode.workspace.openTextDocument({
		language,
		content,
	});
	vscode.window.showTextDocument(document);
}

export async function openFileInEditor(path: string) {
	const document = await vscode.workspace.openTextDocument(path);
	vscode.window.showTextDocument(document);
}

export function insertSnippet(snippet: string): void {
	vscode.commands.executeCommand('editor.action.insertSnippet', {
		snippet,
	});
}

export function getFullRangeFromLines(document: vscode.TextDocument, lineStart: number, lineEnd: number): vscode.Range {
	const lineAtTheEnd = document.lineAt(lineEnd);
	return new vscode.Range(lineStart, 0, lineEnd, lineAtTheEnd.range.end.character);
}

export function setContext(context: string, value: any) {
	vscode.commands.executeCommand('setContext', context, value);
}
