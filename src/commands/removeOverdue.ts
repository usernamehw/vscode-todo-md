import { TextEditor, WorkspaceEdit } from 'vscode';
import { removeOverdueWorkspaceEdit } from '../documentActions';
import { applyEdit, getSelectedLineNumbers } from '../utils/extensionUtils';
import { getTaskAtLineExtension } from '../utils/taskUtils';

export function removeOverdue(editor: TextEditor) {
	const edit = new WorkspaceEdit();

	for (const line of getSelectedLineNumbers(editor)) {
		const task = getTaskAtLineExtension(line);
		if (!task) {
			continue;
		}
		removeOverdueWorkspaceEdit(edit, editor.document, task);
	}

	applyEdit(edit, editor.document);
}
