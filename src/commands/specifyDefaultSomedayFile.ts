import { commands } from 'vscode';
import { specifyDefaultSomedayFile } from '../utils/extensionUtils';

export async function specifyDefaultSomedayFileCommand() {
	await specifyDefaultSomedayFile();
	await commands.executeCommand('list.focusDown');// Workaround for https://github.com/microsoft/vscode/issues/126782
}
