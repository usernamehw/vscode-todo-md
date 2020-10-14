import { StatusBarItem, window } from 'vscode';
import { TheTask } from './TheTask';
import { percentage } from './utils';

export class StatusBar {
	private readonly statusBarItem: StatusBarItem;

	constructor() {
		this.statusBarItem = window.createStatusBarItem(1, -20000);
	}

	show() {
		this.statusBarItem.show();
	}
	hide() {
		this.statusBarItem.hide();
	}
	/**
	 * Show counter for tasks ( completed / all )
	 * Example: ( 1 / 10 )
	 */
	updateText(tasks: TheTask[]) {
		const completedTasks = tasks.filter(t => t.done);
		const percentageString = percentage(completedTasks.length, tasks.length).toFixed(1);
		this.statusBarItem.text = `${completedTasks.length}/${tasks.length} (${percentageString}%)`;
	}
}
