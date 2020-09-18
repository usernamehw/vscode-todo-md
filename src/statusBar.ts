import { StatusBarItem, window } from 'vscode';
import { TheTask } from './TheTask';

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
	 * TODO: show percentage?
	 */
	updateText(tasks: TheTask[]) {
		const completedTasks = tasks.filter(t => t.done);
		this.statusBarItem.text = `( ${completedTasks.length} / ${tasks.length} )`;
	}
}
