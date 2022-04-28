import { TextDocument, window } from 'vscode';
import { startTaskAtLine } from '../documentActions';
import { TaskTreeItem } from '../treeViewProviders/taskProvider';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';

export async function startTask(taskTreeItem?: TaskTreeItem) {
	let lineNumber: number;
	let document: TextDocument;
	if (taskTreeItem instanceof TaskTreeItem) {
		lineNumber = taskTreeItem.task.lineNumber;
		document = await getActiveOrDefaultDocument();
	} else {
		const editor = window.activeTextEditor;
		if (!editor) {
			return;
		}
		lineNumber = editor.selection.start.line;
		document = editor.document;
	}
	startTaskAtLine(document, lineNumber);
}
