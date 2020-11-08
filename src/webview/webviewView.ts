import vscode, { window } from 'vscode';
import { decrementCountForTask, getActiveDocument, goToTask, incrementCountForTask, toggleDoneAtLine, toggleTaskCollapse } from '../documentActions';
import { extensionConfig, Global, state, updateState } from '../extension';
import { findTaskAtLine } from '../taskUtils';
import { WebviewMessage } from '../types';
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
			enableScripts: true,
			enableCommandUris: true,
			localResourceRoots: [
				this._extensionUri,
			],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		this.updateEverything();

		webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
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
					await incrementCountForTask(await getActiveDocument(), message.value, findTaskAtLine(message.value, state.tasksAsTree)!);
					await updateState();
					this.updateEverything();
					break;
				}
				case 'decrementCount': {
					await decrementCountForTask(await getActiveDocument(), message.value, findTaskAtLine(message.value, state.tasksAsTree)!);
					await updateState();
					this.updateEverything();
					break;
				}
				case 'updateTitle': {
					this.updateTitle(message.value);
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
		if (this._view && this._view.visible === true) {
			this._view.webview.postMessage({
				type: 'updateEverything',
				value: {
					tasks: state.tasksAsTree,
					tags: state.tags,
					projects: state.projects,
					contexts: state.contexts,
					defaultFileSpecified: Boolean(extensionConfig.defaultFile),
					activeDocumentOpened: Boolean(state.activeDocument),
					config: extensionConfig.webview,
				},
			} as WebviewMessage);
		}
	}

	updateTitle(numberOfTasks: string) {
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

export function updateWebviewView() {
	if (Global.webviewProvider) {
		Global.webviewProvider.updateEverything();
	}
}

