import vscode, { window } from 'vscode';
import { openSetDueDateInputbox } from '../commands';
import { decrementCountForTask, editTask, editTaskRawText, incrementCountForTask, revealTask, startTask, toggleDoneAtLine, toggleTaskCollapse, toggleTaskCollapseRecursive, tryToDeleteTask } from '../documentActions';
import { updateEverything } from '../events';
import { extensionConfig, extensionState, Global } from '../extension';
import { MessageFromWebview, MessageToWebview } from '../types';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { openFileInEditorByPath } from '../utils/vscodeUtils';
import { getNonce } from './webviewUtils';

export class TasksWebviewViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'todomd.webviewTasks';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			enableCommandUris: true,
			localResourceRoots: [
				this._extensionUri,
			],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		this.sendEverything();
		this.updateTitle(extensionState.tasksAsTree.length);

		webviewView.webview.onDidReceiveMessage(async (message: MessageFromWebview) => {
			switch (message.type) {
				// Needs to update everything
				case 'toggleDone': {
					await toggleDoneAtLine(await getActiveOrDefaultDocument(), message.value);
					await updateEverything();
					break;
				}
				case 'toggleTaskCollapse': {
					await toggleTaskCollapse(await getActiveOrDefaultDocument(), message.value);
					await updateEverything();
					break;
				}
				case 'editTask': {
					await editTask(await getActiveOrDefaultDocument(), message.value);
					await updateEverything();
					break;
				}
				case 'setDueDate': {
					openSetDueDateInputbox(await getActiveOrDefaultDocument(), message.value);
					break;
				}
				case 'startTask': {
					await startTask(await getActiveOrDefaultDocument(), message.value);
					await updateEverything();
					break;
				}
				case 'toggleTaskCollapseRecursive': {
					await toggleTaskCollapseRecursive(await getActiveOrDefaultDocument(), message.value);
					await updateEverything();
					break;
				}
				case 'incrementCount': {
					await incrementCountForTask(await getActiveOrDefaultDocument(), message.value, getTaskAtLineExtension(message.value)!);
					await updateEverything();
					break;
				}
				case 'decrementCount': {
					await decrementCountForTask(await getActiveOrDefaultDocument(), message.value, getTaskAtLineExtension(message.value)!);
					await updateEverything();
					break;
				}
				case 'deleteTask': {
					await tryToDeleteTask(await getActiveOrDefaultDocument(), message.value);
					await updateEverything();
					break;
				}
				case 'editTaskRawText': {
					await editTaskRawText(await getActiveOrDefaultDocument(), message.value.lineNumber, message.value.newRawText);
					await updateEverything();
					break;
				}
				// No need to update everything
				case 'showNotification': {
					window.showInformationMessage(message.value);
					break;
				}
				case 'goToTask': {
					revealTask(message.value);
					break;
				}
				case 'updateWebviewTitle': {
					this.updateTitle(message.value);
					break;
				}
				case 'openFileByPath': {
					openFileInEditorByPath(message.value);
					break;
				}
			}
		});
		webviewView.onDidChangeVisibility(e => {
			if (webviewView.visible === true) {
				this.sendEverything();
			}
		});
	}
	/**
	 * Send all the needed data to the webview view
	 */
	sendEverything() {
		if (this._view && this._view.visible === true) {
			this.sendMessageToWebview({
				type: 'updateEverything',
				value: {
					tasksAsTree: extensionState.tasksAsTree,
					tags: extensionState.tags,
					projects: extensionState.projects,
					contexts: extensionState.contexts,
					defaultFileSpecified: Boolean(extensionConfig.defaultFile),
					activeDocumentOpened: Boolean(extensionState.activeDocument),
					config: extensionConfig.webview,
				},
			});
		}
	}
	/**
	 * Update webview title (counter)
	 */
	updateTitle(numberOfTasks: number) {
		if (this._view) {
			this._view.title = `webview (${numberOfTasks})`;
		}
	}

	focusFilterInput() {
		this.sendMessageToWebview({
			type: 'focusFilterInput',
		});
	}

	private sendMessageToWebview(message: MessageToWebview) {
		this._view?.webview.postMessage(message);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const JSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.js'));
		const CSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css'));
		const codiconCSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'codicon.css'));
		const nonce = getNonce();// Use a nonce to only allow a specific script to be run.

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<link href="${codiconCSSUri}" rel="stylesheet" />
				<link href="${CSSUri}" rel="stylesheet">
				<title>Tasks</title>
			</head>
			<body>
				<div id="app"></div>
				<script defer nonce="${nonce}" src="${JSUri}"></script>
			</body>
			</html>`;
	}
}
/**
 * Update main webview view (tasks)
 */
export function updateWebviewView() {
	if (Global.webviewProvider) {
		Global.webviewProvider.sendEverything();
	}
}

