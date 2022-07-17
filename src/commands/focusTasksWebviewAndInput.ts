import { commands } from 'vscode';
import { focusWebviewFilterInput } from '../webview/webviewView';

export async function focusTasksWebviewAndInput() {
	await commands.executeCommand('todomd.webviewTasks.focus');
	focusWebviewFilterInput();
}
