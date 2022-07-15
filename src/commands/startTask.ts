import { TextDocument, window, WorkspaceEdit } from 'vscode';
import { startTaskAtLineWorkspaceEdit } from '../documentActions';
import { TaskTreeItem } from '../treeViewProviders/taskProvider';
import { applyEdit, getActiveOrDefaultDocument, getSelectedLineNumbers } from '../utils/extensionUtils';

export async function startTask(taskTreeItem?: TaskTreeItem) {
	const workspaceEdit = new WorkspaceEdit();
	let document: TextDocument;
	if (taskTreeItem instanceof TaskTreeItem) {
		const lineNumber = taskTreeItem.task.lineNumber;
		document = await getActiveOrDefaultDocument();
		startTaskAtLineWorkspaceEdit(workspaceEdit, document, lineNumber);
	} else {
		const editor = window.activeTextEditor;
		if (!editor) {
			return undefined;
		}
		document = editor.document;
		for (const lineNumber of getSelectedLineNumbers(editor)) {
			startTaskAtLineWorkspaceEdit(workspaceEdit, document, lineNumber);
		}
	}
	return await applyEdit(workspaceEdit, document);
}
