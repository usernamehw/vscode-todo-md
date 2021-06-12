import { StatusBarItem, window } from 'vscode';
import { extensionConfig } from './extension';
import { TheTask } from './TheTask';
import { percentage } from './utils/utils';
/**
 * Handles counter status bar item
 */
export class StatusBar {
	private readonly statusBarItem: StatusBarItem;

	constructor() {
		this.statusBarItem = window.createStatusBarItem('Todo MD: Counter', 1, -20000);
		this.statusBarItem.name = 'Todo MD: Counter';
	}

	show() {
		if (extensionConfig.statusBarCounterEnabled) {
			this.statusBarItem.show();
		}
	}
	hide() {
		this.statusBarItem.hide();
	}
	/**
	 * Show counter for tasks ( completed / all )
	 * Example: `1 / 10 (10%)`
	 */
	updateText(tasks: TheTask[]) {
		const completedTasks = tasks.filter(t => t.done);
		const percentageString = percentage(completedTasks.length, tasks.length).toFixed(1);
		this.statusBarItem.text = `${completedTasks.length}/${tasks.length} (${percentageString}%)`;
	}
}
