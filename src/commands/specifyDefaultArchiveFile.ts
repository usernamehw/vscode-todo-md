import { commands } from 'vscode';
import { updateArchivedTasks } from '../treeViewProviders/treeViews';
import { specifyDefaultArchiveFile } from '../utils/extensionUtils';

export async function specifyDefaultArchiveFileCommand() {
	await specifyDefaultArchiveFile();
	await commands.executeCommand('list.focusDown');// Workaround for https://github.com/microsoft/vscode/issues/126782
	await updateArchivedTasks();
}
