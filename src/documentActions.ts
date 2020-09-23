// Given `vscode.TextDocument` and `lineNumber: number` do different things with the file
// TODO: maybe this file should be a class?

import { applyEdit, getTaskAtLine, insertCompletionDate, setCountCurrentValue, updateArchivedTasks } from 'src/commands';
import { extensionConfig, state } from 'src/extension';
import { TheTask } from 'src/TheTask';
import { appendTaskToFile } from 'src/utils';
import vscode, { TextDocument, WorkspaceEdit } from 'vscode';

export function hideTask(document: vscode.TextDocument, lineNumber: number) {
	const wEdit = new WorkspaceEdit();
	const line = document.lineAt(lineNumber);
	wEdit.insert(document.uri, new vscode.Position(lineNumber, line.range.end.character), ' {h}');
	applyEdit(wEdit, document);
}

export function deleteTask(document: vscode.TextDocument, lineNumber: number) {
	const wEdit = new WorkspaceEdit();
	wEdit.delete(document.uri, document.lineAt(lineNumber).rangeIncludingLineBreak);
	applyEdit(wEdit, document);
}
/**
 * Either toggle done or increment count
 */
export async function toggleDone(document: vscode.TextDocument, lineNumber: number): Promise<void> {
	const task = getTaskAtLine(lineNumber);
	if (!task) {
		return;
	}
	if (task.specialTags.count) {
		await incrementCountForTask(document, lineNumber, task);
	} else {
		await toggleTaskCompletionAtLine(lineNumber, document);
	}
}
export async function incrementCountForTask(document: vscode.TextDocument, lineNumber: number, task: TheTask) {
	const line = document.lineAt(lineNumber);
	const wEdit = new WorkspaceEdit();
	const count = task.specialTags.count;
	if (!count) {
		return Promise.resolve(undefined);
	}
	let newValue = 0;
	if (count.current !== count.needed) {
		newValue = count.current + 1;
		if (newValue === count.needed) {
			insertCompletionDate(wEdit, document.uri, line);
		}
		setCountCurrentValue(wEdit, document.uri, count, String(newValue));
	} else {
		setCountCurrentValue(wEdit, document.uri, count, '0');
		removeCompletionDate(wEdit, document.uri, line);
	}
	return applyEdit(wEdit, document);
}
export async function toggleTaskCompletionAtLine(lineNumber: number, document: TextDocument): Promise<void> {
	const { firstNonWhitespaceCharacterIndex } = document.lineAt(lineNumber);
	const task = getTaskAtLine(lineNumber);
	if (!task) {
		return;
	}
	const line = document.lineAt(lineNumber);
	const wEdit = new WorkspaceEdit();
	if (task.done) {
		if (!extensionConfig.addCompletionDate) {
			if (line.text.trim().startsWith(extensionConfig.doneSymbol)) {
				wEdit.delete(document.uri, new vscode.Range(lineNumber, firstNonWhitespaceCharacterIndex, lineNumber, firstNonWhitespaceCharacterIndex + extensionConfig.doneSymbol.length));
			}
		} else {
			removeCompletionDate(wEdit, document.uri, line);
		}
	} else {
		if (extensionConfig.addCompletionDate) {
			insertCompletionDate(wEdit, document.uri, line);
		} else {
			wEdit.insert(document.uri, new vscode.Position(lineNumber, firstNonWhitespaceCharacterIndex), extensionConfig.doneSymbol);
		}
	}
	await applyEdit(wEdit, document);

	if (extensionConfig.autoArchiveTasks) {
		const secondWorkspaceEdit = new WorkspaceEdit();
		archiveTask(secondWorkspaceEdit, document.uri, line, !task.due?.isRecurring);
		await applyEdit(secondWorkspaceEdit, document);// Not possible to apply conflicting ranges with just one edit
	}
}
export function removeCompletionDate(wEdit: WorkspaceEdit, uri: vscode.Uri, line: vscode.TextLine) {
	const completionDateRegex = /\s{cm:\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?}\s?/;
	const match = completionDateRegex.exec(line.text);
	if (match) {
		wEdit.delete(uri, new vscode.Range(line.lineNumber, match.index, line.lineNumber, match.index + match[0].length));
	}
}
export function archiveTask(wEdit: WorkspaceEdit, uri: vscode.Uri, line: vscode.TextLine, shouldDelete: boolean) {
	appendTaskToFile(line.text, extensionConfig.defaultArchiveFile);
	if (shouldDelete) {
		wEdit.delete(uri, line.rangeIncludingLineBreak);
	}
	updateArchivedTasks();
}

export async function goToTask(lineNumber: number) {
	const document = getActiveDocument();
	const editor = await vscode.window.showTextDocument(document);
	const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
	editor.selection = new vscode.Selection(range.start, range.end);
	editor.revealRange(range, vscode.TextEditorRevealType.Default);
	const lineHighlightDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: '#ffa30468',
		isWholeLine: true,
	});
	editor.setDecorations(lineHighlightDecorationType, [range]);
	setTimeout(() => {
		editor.setDecorations(lineHighlightDecorationType, []);
	}, 600);
}

export function getActiveDocument() {
	if (state.activeDocument === undefined) {
		vscode.window.showErrorMessage('No active document');
		throw new Error('No active document');
	}
	return state.activeDocument;
}

export async function getDocumentForDefaultFile() {
	return await vscode.workspace.openTextDocument(vscode.Uri.file(extensionConfig.defaultFile));
}
