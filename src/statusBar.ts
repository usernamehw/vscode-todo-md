import { MarkdownString, StatusBarAlignment, StatusBarItem, window } from 'vscode';
import { TheTask } from './TheTask';
import { CommandId } from './commands';
import { Constants } from './constants';
import { $config } from './extension';
import { getTasksHoverMd } from './languageFeatures/getTaskHover';
import { formatTask } from './utils/taskUtils';
import { percentage } from './utils/utils';
import { filterTasks } from './filter';

abstract class StatusBar {
	protected statusBarItem!: StatusBarItem;

	abstract show(): void;
	abstract update(...args: any[]): void;

	hide(): void {
		this.statusBarItem.hide();
	}

	dispose(): void {
		this.statusBarItem?.dispose();
	}

	protected updateText(text: string): void {
		this.statusBarItem.text = text;
	}

	protected updateHover(text: MarkdownString | string): void {
		this.statusBarItem.tooltip = text;
	}
}


export class CounterStatusBar extends StatusBar {
	constructor() {
		super();
		this.createStatusBarItem();
	}

	/**
	 * Dispose and create/recreate status bar item. Happens only on extension config change.
	 */
	createStatusBarItem() {
		this.dispose();
		this.statusBarItem = window.createStatusBarItem(
			`${Constants.ExtensionMenuPrefix} Counter ${Math.random()}`,
			$config.counterStatusBarItem.alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right,
			$config.counterStatusBarItem.priority,
		);
		this.show();
	}

	show() {
		if ($config.counterStatusBarItem.enabled) {
			this.statusBarItem.show();
		} else {
			this.statusBarItem.hide();
		}
	}

	/**
	 * @param tasks All tasks that percentage should be calculated from.
	 */
	update(tasks: TheTask[]) {
		if (!$config.counterStatusBarItem.enabled) {
			return;
		}

		const completedTasks = tasks.filter(t => t.done);
		this.statusBarItem.text = showCompletedPercentage(tasks.length, completedTasks.length);
	}
}

export class MainStatusBar extends StatusBar {
	constructor() {
		super();
		this.createStatusBarItem();
	}

	/**
	 * Dispose and create/recreate status bar item. Happens only on extension config change.
	 */
	createStatusBarItem() {
		this.dispose();
		this.statusBarItem = window.createStatusBarItem(
			`${Constants.ExtensionMenuPrefix} Main ${Math.random()}`,
			$config.mainStatusBarItem.alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right,
			$config.mainStatusBarItem.priority,
		);
		this.statusBarItem.command = $config.mainStatusBarItem.onClick === 'nothing' ? undefined : CommandId.MainStatusBarCommand;
		this.show();
	}

	show() {
		if ($config.mainStatusBarItem.enabled) {
			this.statusBarItem.show();
		} else {
			this.statusBarItem.hide();
		}
	}

	update(fewNextTasks: TheTask[]) {
		if (!$config.mainStatusBarItem.enabled) {
			return;
		}

		let nextTasksForStatusBar = fewNextTasks;
		if ($config.mainStatusBarItem.targetTasks === 'due') {
			nextTasksForStatusBar = filterTasks(fewNextTasks, '$due').tasks;
		}

		this.updateText(nextTasksForStatusBar.length ? formatTask(nextTasksForStatusBar[0]) : '');
		const hover = $config.mainStatusBarItem.hoverEnabled ? getTasksHoverMd(nextTasksForStatusBar.slice(0, $config.getNextNumberOfTasks)) : '';
		this.updateHover(hover);
	}
}

export function showCompletedPercentage(tasksCount: number, completedTasksCount: number): string {
	const percentageString = percentage(completedTasksCount, tasksCount).toFixed(1);
	return `${completedTasksCount}/${tasksCount} (${percentageString}%)`;
}
