import vscode, { window } from 'vscode';
import { decrementCountForTask, goToTask, incrementCountForTask, toggleDoneAtLine, toggleTaskCollapse, tryToDeleteTask } from '../documentActions';
import { extensionConfig, extensionState, Global, updateState } from '../extension';
import { messageFromWebview } from '../types';
import { getActiveDocument } from '../utils/extensionUtils';
import { findTaskAtLineExtension } from '../utils/taskUtils';
import { followLink } from '../utils/vscodeUtils';
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

		this.updateEverything();
		this.updateTitle(extensionState.tasksAsTree.length);

		webviewView.webview.onDidReceiveMessage(async (message: messageFromWebview) => {
			switch (message.type) {
				case 'toggleDone': {
					await toggleDoneAtLine(await getActiveDocument(), message.value);
					await updateState();
					this.updateEverything();
					break;
				}
				case 'showNotification': {
					window.showInformationMessage(message.value);
					break;
				}
				case 'goToTask': {
					goToTask(message.value);
					break;
				}
				case 'toggleTaskCollapse': {
					await toggleTaskCollapse(await getActiveDocument(), message.value);
					await updateState();
					this.updateEverything();
					break;
				}
				case 'incrementCount': {
					await incrementCountForTask(await getActiveDocument(), message.value, findTaskAtLineExtension(message.value)!);
					await updateState();
					this.updateEverything();
					break;
				}
				case 'decrementCount': {
					await decrementCountForTask(await getActiveDocument(), message.value, findTaskAtLineExtension(message.value)!);
					await updateState();
					this.updateEverything();
					break;
				}
				case 'deleteTask': {
					await tryToDeleteTask(await getActiveDocument(), message.value);
					await updateState();
					this.updateEverything();
					break;
				}
				case 'updateTitle': {
					this.updateTitle(message.value);
					break;
				}
				case 'followLink': {
					followLink(message.value);
					break;
				}
			}
		});
		webviewView.onDidChangeVisibility(e => {
			if (webviewView.visible === true) {
				this.updateEverything();
			}
		});
	}
	/**
	 * Send all the needed data to webview view
	 */
	updateEverything() {
		if (this._view && this._view.visible === true) {
			this._view.webview.postMessage({
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
			} as messageFromWebview);
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

	private _getHtmlForWebview(webview: vscode.Webview) {
		const JSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.js'));
		const CSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css'));
		const codiconCSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'codicon.css'));
		const codiconFontUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'codicon.ttf'));
		const nonce = getNonce();// Use a nonce to only allow a specific script to be run.

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${codiconFontUri}; style-src 'unsafe-inline' ${webview.cspSource} ${codiconCSSUri}; script-src 'nonce-${nonce}';">
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
		Global.webviewProvider.updateEverything();
	}
}

