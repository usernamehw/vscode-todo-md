import { window } from 'vscode';
import { addTaskToFile } from '../commands';
import { extensionState, updateState } from '../extension';
import { updateAllTreeViews } from '../treeViewProviders/treeViews';

export async function addTaskToActiveFile() {
	const activeFilePath = extensionState.activeDocument?.uri.fsPath;
	if (!activeFilePath) {
		return;
	}
	const text = await window.showInputBox({
		prompt: 'Add a task to active file',
	});
	if (!text) {
		return;
	}
	addTaskToFile(text, activeFilePath);
	await updateState();
	updateAllTreeViews();
}
