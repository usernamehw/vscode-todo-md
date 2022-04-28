import { TextDocument, window, WorkspaceEdit } from 'vscode';
import { getSelectedLineNumbers } from '../commands';
import { startTaskAtLineWorkspaceEdit } from '../documentActions';
import { TaskTreeItem } from '../treeViewProviders/taskProvider';
import { applyEdit, getActiveOrDefaultDocument } from '../utils/extensionUtils';

export async function startTask(taskTreeItem?: TaskTreeItem) {
	const workspaceEdit = new WorkspaceEdit();
	let lineNumber: number;
	let document: TextDocument;
	if (taskTreeItem instanceof TaskTreeItem) {
		lineNumber = taskTreeItem.task.lineNumber;
		document = await getActiveOrDefaultDocument();
		startTaskAtLineWorkspaceEdit(workspaceEdit, document, lineNumber);
	} else {
		const editor = window.activeTextEditor;
		if (!editor) {
			return undefined;
		}
		document = editor.document;
		for (const line of getSelectedLineNumbers(editor)) {
			startTaskAtLineWorkspaceEdit(workspaceEdit, document, line);
		}
	}
	return await applyEdit(workspaceEdit, document);
}
