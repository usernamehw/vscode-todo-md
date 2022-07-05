import { TextDocument, window, WorkspaceEdit } from 'vscode';
import { getSelectedLineNumbers } from '../commands';
import { toggleFavoriteWorkspaceEdit } from '../documentActions';
import { TaskTreeItem } from '../treeViewProviders/taskProvider';
import { applyEdit, getActiveOrDefaultDocument } from '../utils/extensionUtils';

export async function toggleFavoriteTask(taskTreeItem?: TaskTreeItem) {
	const workspaceEdit = new WorkspaceEdit();
	let document: TextDocument;
	if (taskTreeItem instanceof TaskTreeItem) {
		const lineNumber = taskTreeItem.task.lineNumber;
		document = await getActiveOrDefaultDocument();
		toggleFavoriteWorkspaceEdit(workspaceEdit, document, lineNumber);
	} else {
		const editor = window.activeTextEditor;
		if (!editor) {
			return undefined;
		}
		document = editor.document;
		for (const lineNumber of getSelectedLineNumbers(editor)) {
			toggleFavoriteWorkspaceEdit(workspaceEdit, document, lineNumber);
		}
	}

	return await applyEdit(workspaceEdit, document);
}
