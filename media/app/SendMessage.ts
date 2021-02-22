import { vscodeApi } from './store';

/**
 * Send message from Webview to Extension
 */
export class SendMessage {
	static toggleDone(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'toggleDone',
			value: lineNumber,
		});
	}
	static revealTask(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'goToTask',
			value: lineNumber,
		});
	}
	static incrementCount(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'incrementCount',
			value: lineNumber,
		});
	}
	static decrementCount(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'decrementCount',
			value: lineNumber,
		});
	}
	static deleteTask(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'deleteTask',
			value: lineNumber,
		});
	}
	static toggleTaskCollapse(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'toggleTaskCollapse',
			value: lineNumber,
		});
	}
	static openInDefaultApp(link: string) {
		vscodeApi.postMessage({
			type: 'followLink',
			value: link,
		});
	}
	static showNotification(text: string) {
		vscodeApi.postMessage({
			type: 'showNotification',
			value: text,
		});
	}
	static updateWebviewTitle(numberOfTasks: number) {
		vscodeApi.postMessage({
			type: 'updateTitle',
			value: numberOfTasks,
		});
	}
	static editRawText(lineNumber: number, newRawText: string) {
		vscodeApi.postMessage({
			type: 'editTaskRawText',
			value: {
				lineNumber,
				newRawText,
			},
		});
	}
}
