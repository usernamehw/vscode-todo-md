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
	static startTask(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'startTask',
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
	static setDueDate(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'setDueDate',
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
			type: 'updateWebviewTitle',
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
	static toggleTaskCollapseRecursive(lineNumber: number) {
		vscodeApi.postMessage({
			type: 'toggleTaskCollapseRecursive',
			value: lineNumber,
		});
	}
}
