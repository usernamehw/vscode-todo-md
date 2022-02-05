import { Range, TextDocument, WorkspaceEdit } from 'vscode';
import { setDueDateAtLine } from '../documentActions';
import { applyEdit } from '../utils/extensionUtils';

export async function setDueDateWithArgs(document: TextDocument, wordRange: Range, dueDate: string) {
	const lineNumber = wordRange.start.line;
	const edit = new WorkspaceEdit();
	edit.delete(document.uri, wordRange);
	await applyEdit(edit, document);
	setDueDateAtLine(document, lineNumber, dueDate);
}
