import { commands } from 'vscode';
import { Global } from '../extension';

export async function focusTasksWebviewAndInput() {
	await commands.executeCommand('todomd.webviewTasks.focus');
	Global.webviewProvider.focusFilterInput();
}
