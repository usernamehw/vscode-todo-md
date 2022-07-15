import { TextEditor, Uri, workspace, WorkspaceEdit } from 'vscode';
import { appendTaskToFileWorkspaceEdit } from '../documentActions';
import { $config } from '../extension';
import { applyEdit, checkSomedayFileAndNotify, getLineNumbersThatCanBeMovedToAnotherFile } from '../utils/extensionUtils';

export async function moveToSomeday(editor: TextEditor) {
	const isSomedayFileSpecified = await checkSomedayFileAndNotify();
	if (!isSomedayFileSpecified) {
		return;
	}

	const somedayEdit = new WorkspaceEdit();
	const activeFileEdit = new WorkspaceEdit();

	const somedayFileUri = Uri.file($config.defaultSomedayFile);
	const somedayDocument = await workspace.openTextDocument(somedayFileUri);

	const lineNumbers = getLineNumbersThatCanBeMovedToAnotherFile(editor);
	for (const lineNumber of lineNumbers) {
		const line = editor.document.lineAt(lineNumber);
		appendTaskToFileWorkspaceEdit(somedayEdit, somedayDocument, line.text);
		activeFileEdit.delete(editor.document.uri, line.rangeIncludingLineBreak);
	}
	await applyEdit(somedayEdit, somedayDocument);
	await applyEdit(activeFileEdit, editor.document);
}
