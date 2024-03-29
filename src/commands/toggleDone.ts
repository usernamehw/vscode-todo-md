import { TextDocument, window } from 'vscode';
import { toggleDoneOrIncrementCountAtLines } from '../documentActions';
import { updateState } from '../extension';
import { TaskTreeItem } from '../treeViewProviders/taskProvider';
import { updateAllTreeViews } from '../treeViewProviders/treeViews';
import { getActiveOrDefaultDocument, getSelectedLineNumbers } from '../utils/extensionUtils';

export async function toggleDone(treeItem?: TaskTreeItem) {
	const editor = window.activeTextEditor;
	let document: TextDocument;
	let lineNumbers: number[] = [];
	if (treeItem) {
		lineNumbers.push(treeItem.task.lineNumber);
		document = await getActiveOrDefaultDocument();
	} else {
		if (!editor) {
			return;
		}
		lineNumbers = getSelectedLineNumbers(editor);
		document = editor.document;
	}

	await toggleDoneOrIncrementCountAtLines(document, lineNumbers);

	await updateState();
	updateAllTreeViews();
}
