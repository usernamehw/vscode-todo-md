import { TextEditor, WorkspaceEdit } from 'vscode';
import { getSelectedLineNumbers } from '../commands';
import { incrementOrDecrementPriorityWorkspaceEdit } from '../documentActions';
import { applyEdit } from '../utils/extensionUtils';

export function decrementPriority(editor: TextEditor) {
	const edit = new WorkspaceEdit();

	for (const line of getSelectedLineNumbers(editor)) {
		incrementOrDecrementPriorityWorkspaceEdit(edit, editor.document, line, 'decrement');
	}

	applyEdit(edit, editor.document);
}
