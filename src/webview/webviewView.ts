import path from 'path';
import { CancellationToken, Uri, Webview, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window } from 'vscode';
import { openSetDueDateInputbox } from '../commands/setDueDate';
import { decrementCountForTask, editTask, editTaskRawText, incrementCountForTask, revealTask, startTaskAtLine, toggleDoneAtLine, toggleTaskCollapse, toggleTaskCollapseRecursive, tryToDeleteTask } from '../documentActions';
import { updateEverything } from '../events';
import { $config, $state, Global } from '../extension';
import { MessageFromWebview, MessageToWebview } from '../types';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { followLink } from '../utils/vscodeUtils';
import { getNonce } from './webviewUtils';

export class TasksWebviewViewProvider implements WebviewViewProvider {
	public static readonly viewType = 'todomd.webviewTasks';

	private _view?: WebviewView;

	constructor(
		private readonly _extensionUri: Uri,
	) { }

	public resolveWebviewView(
		webviewView: WebviewView,
		context: WebviewViewResolveContext,
		_token: CancellationToken,
	) {
		this._view = webviewView;

		const localResourceRoots = [
			this._extensionUri,
		];

		if ($config.webview.customCSSPath) {
			localResourceRoots.push(Uri.file(path.dirname($config.webview.customCSSPath)));
		}

		webviewView.webview.options = {
			enableScripts: true,
			enableCommandUris: true,
			localResourceRoots,
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (message: MessageFromWebview) => {
			switch (message.type) {
				// ──── Needs to update everything ────────────────────────────
				case 'webviewLoaded': {
					this.sendEverything();
					break;
				}
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
				case 'startTask': {
					await startTaskAtLine(message.value, await getActiveOrDefaultDocument());
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
				// ──── No need to update everything ──────────────────────────
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
				case 'followLink': {
					followLink(message.value);
					break;
				}
				case 'setDueDate': {
					openSetDueDateInputbox(await getActiveOrDefaultDocument(), [message.value]);
					break;
				}
			}
		});
		/**
		 * Update webview on it's visibility change (only when it becomes visible).
		 */
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
					tasksAsTree: $state.tasksAsTree,
					tags: $state.tags,
					projects: $state.projects,
					contexts: $state.contexts,
					defaultFileSpecified: Boolean($config.defaultFile),
					activeDocumentOpened: Boolean($state.activeDocument),
					config: $config.webview,
				},
			});
			this.updateTitle($state.tasksAsTree.length);
		}
	}
	/**
	 * Update webview title (counter).
	 */
	updateTitle(numberOfTasks: number) {
		if (this._view) {
			this._view.title = `webview (${numberOfTasks})`;
		}
	}
	/**
	 * Focus main input in webview.
	 */
	focusFilterInput() {
		this.sendMessageToWebview({
			type: 'focusFilterInput',
		});
	}
	/**
	 * Send message. js objects that will be serialized to json.
	 */
	private sendMessageToWebview(message: MessageToWebview) {
		this._view?.webview.postMessage(message);
	}
	/**
	 * Generate html template for webview.
	 */
	private _getHtmlForWebview(webview: Webview) {
		const JSUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'webview.js'));
		const CSSUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'webview.css'));
		const codiconCSSUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'vendor', 'codicon.css'));
		const nonce = getNonce();// Use a nonce to only allow a specific script to be run.

		const userCSSLink = $config.webview.customCSSPath ? `<link href="${webview.asWebviewUri(Uri.file($config.webview.customCSSPath))}" rel="stylesheet">` : '';

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<link href="${codiconCSSUri}" rel="stylesheet" />
				<link href="${CSSUri}" rel="stylesheet">
				${userCSSLink}
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

