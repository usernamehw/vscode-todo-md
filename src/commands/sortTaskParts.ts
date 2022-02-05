import { TextEditor, WorkspaceEdit } from 'vscode';
import { getSelectedLineNumbers } from '../commands';
import { editTaskWorkspaceEdit } from '../documentActions';
import { applyEdit } from '../utils/extensionUtils';
import { getTaskAtLineExtension } from '../utils/taskUtils';

export async function sortTaskParts(editor: TextEditor) {
	const lineNumbers = getSelectedLineNumbers(editor);
	const edit = new WorkspaceEdit();
	for (const ln of lineNumbers) {
		const task = getTaskAtLineExtension(ln);
		if (!task) {
			continue;
		}
		editTaskWorkspaceEdit(edit, editor.document, task);
	}
	await applyEdit(edit, editor.document);
}
