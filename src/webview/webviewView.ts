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

		if (!state.theRightFileOpened && !extensionConfig.defaultFile) {
			return;
		}
		this.updateEverything();

		webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
			switch (message.type) {
				case 'toggleDone': {
					toggleTaskCompletionAtLine(message.value, getActiveDocument());
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
				case 'incrementCount': {
					await incrementCountForTask(getActiveDocument(), message.value, getTaskAtLine(message.value)!);
					await updateState();
					this.updateEverything();
					break;
				}
				case 'decrementCount': {
					await decrementCountForTask(getActiveDocument(), message.value, getTaskAtLine(message.value)!);
					await updateState();
					this.updateEverything();
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

	updateEverything() {
		if (this._view) {
			this.updateWebviewConfig(extensionConfig.webview);
			this._view.webview.postMessage({
				type: 'updateEverything',
				value: {
					tasks: state.tasks,
					tags: state.tags,
					projects: state.projects,
					contexts: state.contexts,
				},
			} as WebviewMessage);
		}
		this.updateTitle(`webview (${state.tasks.length})`);
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
		const JSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.js'));
		const CSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css'));
		const codiconCSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'codicon.css'));
		const codiconFontUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'codicon.ttf'));
		const awesomepleteCSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'awesomplete.css'));
		const awesomepleteJSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'awesomplete.js'));
		const nonce = getNonce();// Use a nonce to only allow a specific script to be run.

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${codiconFontUri}; style-src ${webview.cspSource} ${codiconCSSUri} ${awesomepleteCSSUri}; script-src 'nonce-${nonce}';">
				<link href="${codiconCSSUri}" rel="stylesheet" />
				<link href="${awesomepleteCSSUri}" rel="stylesheet" />
				<link href="${CSSUri}" rel="stylesheet">
				<title>Tasks</title>
			</head>
			<body>
				<div class="filter-input-container">
					<input type="text" class="filter-input" id="filterInput">
				</div>
				<div class="list"></div>
				<script defer nonce="${nonce}" src="${awesomepleteJSUri}"></script>
				<script defer nonce="${nonce}" src="${JSUri}"></script>
			</body>
			</html>`;
	}
}

export function updateWebviewView(tasks: TheTask[]) {
	if (Global.webviewProvider) {
		Global.webviewProvider.updateEverything();
	}
}
