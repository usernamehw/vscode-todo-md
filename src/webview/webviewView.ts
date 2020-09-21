import { getActiveDocument, goToTask, toggleDone } from 'src/documentActions';
import { extensionConfig, Global } from 'src/extension';
import { TheTask } from 'src/TheTask';
import { IExtensionConfig, WebviewMessage } from 'src/types';
import { getNonce } from 'src/webview/utils';
import vscode, { window } from 'vscode';

export class TasksWebviewViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'todomd.webviewTasks';

	private _view?: vscode.WebviewView;
	private _tasks: TheTask[] = [];

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
		this.updateWebviewConfig(extensionConfig.webview);

		webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
			switch (message.type) {
				case 'toggleDone': {
					toggleDone(getActiveDocument(), message.value);
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
			}
		});
		webviewView.onDidChangeVisibility(e => {
			if (webviewView.visible === true) {
				this.updateTasks(this._tasks);
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
		this._tasks = tasks;
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
		const nonce = getNonce();// Use a nonce to only allow a specific script to be run.

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet">
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
	Global.webviewProvider.updateTasks(tasks);
}
