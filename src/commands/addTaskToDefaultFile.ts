import { window } from 'vscode';
import { addTaskToFile } from '../commands';
import { extensionConfig, updateState } from '../extension';
import { updateAllTreeViews } from '../treeViewProviders/treeViews';
import { checkDefaultFileAndNotify } from '../utils/extensionUtils';

export async function addTaskToDefaultFile() {
	const isDefaultFileSpecified = await checkDefaultFileAndNotify();
	if (!isDefaultFileSpecified) {
		return;
	}
	const text = await window.showInputBox({
		prompt: 'Add a task to default file',
	});
	if (!text) {
		return;
	}
	await addTaskToFile(text, extensionConfig.defaultFile);
	await updateState();
	updateAllTreeViews();
}
