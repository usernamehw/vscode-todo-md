import { commands } from 'vscode';
import { Constants } from '../constants';
import { showAddNewTaskModal } from '../webview/webviewView';

export function addTaskToActiveFileWebview() {
	commands.executeCommand(Constants.FocusWebviewViewCommandId);
	showAddNewTaskModal();
}
