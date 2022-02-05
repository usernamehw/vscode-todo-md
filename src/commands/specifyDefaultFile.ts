import { commands } from 'vscode';
import { specifyDefaultFile } from '../utils/extensionUtils';

export async function specifyDefaultFileCommand() {
	await specifyDefaultFile();
	await commands.executeCommand('list.focusDown');// Workaround for https://github.com/microsoft/vscode/issues/126782
}
