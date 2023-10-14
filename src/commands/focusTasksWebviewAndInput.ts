import { commands } from 'vscode';
import { focusWebviewFilterInput } from '../webview/webviewView';

export async function focusTasksWebviewAndInput(args: { selectInputText?: boolean; fillInputValue?: string }) {
	await commands.executeCommand('todomd.webviewTasks.focus');
	await commands.executeCommand('todomd.webviewTasks.focus');
	await commands.executeCommand('todomd.webviewTasks.focus');

	focusWebviewFilterInput({
		selectInputText: args?.selectInputText,
		fillInputValue: args?.fillInputValue,
	});
}
