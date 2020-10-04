import vscode, { window } from 'vscode';
import { getTaskAtLine } from '../commands';
import { decrementCountForTask, getActiveDocument, goToTask, incrementCountForTask, toggleTaskCompletionAtLine } from '../documentActions';
import { extensionConfig, Global, state, updateState } from '../extension';
import { TheTask } from '../TheTask';
import { IExtensionConfig, WebviewMessage } from '../types';
import { getNonce } from '../webview/utils';

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
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri,
			],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
		this.updateTasks(state.tasks);

		webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
			switch (message.type) {
				case 'toggleDone': {
					toggleTaskCompletionAtLine(message.value, getActiveDocument());
					await updateState();
					this.updateTasks(state.tasks);
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
				case 'incrementCount': {
					await incrementCountForTask(getActiveDocument(), message.value, getTaskAtLine(message.value)!);
					await updateState();
					this.updateTasks(state.tasks);
					break;
				}
				case 'decrementCount': {
					await decrementCountForTask(getActiveDocument(), message.value, getTaskAtLine(message.value)!);
					await updateState();
					this.updateTasks(state.tasks);
					break;
				}
			}
		});
		webviewView.onDidChangeVisibility(e => {
			if (webviewView.visible === true) {
				this.updateTasks(state.tasks);
			}
		});
	}

	updateTasks(tasks: TheTask[]) {
		if (this._view) {
			this.updateWebviewConfig(extensionConfig.webview);
			this._view.webview.postMessage({
				type: 'updateTasks',
				value: tasks,
			} as WebviewMessage);
		}
		this.updateTitle(`webview (${tasks.length})`);
	}

	updateWebviewConfig(config: IExtensionConfig['webview']) {
		this._view?.webview.postMessage({
			type: 'updateConfig',
			value: config,
		} as WebviewMessage);
	}

	updateTitle(newTitle: string) {
		if (this._view) {
			this._view.title = newTitle;
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.css'));
		const codiconsFontUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.ttf'));
		const nonce = getNonce();// Use a nonce to only allow a specific script to be run.

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${codiconsFontUri}; style-src ${webview.cspSource} ${codiconsUri}; script-src 'nonce-${nonce}';">
				<link href="${styleUri}" rel="stylesheet">
				<link href="${codiconsUri}" rel="stylesheet" />
				<title>Tasks</title>
			</head>
			<body>
				<div class="filter-input-container">
					<input type="text" class="filter-input" id="filterInput">
				</div>
				<div class="list"></div>
				<script defer nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

export function updateWebviewView(tasks: TheTask[]) {
	if (Global.webviewProvider) {
		Global.webviewProvider.updateTasks(tasks);
	}
}
