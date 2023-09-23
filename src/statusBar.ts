import { MarkdownString, StatusBarAlignment, StatusBarItem, ThemeColor, window } from 'vscode';
import { TheTask } from './TheTask';
import { CommandId } from './commands';
import { Constants } from './constants';
import { $config } from './extension';
import { filterTasks } from './filter';
import { getTasksHoverMd } from './languageFeatures/getTaskHover';
import { ExtensionConfig, IsDue } from './types';
import { formatTask } from './utils/taskUtils';
import { percentage, truncate } from './utils/utils';

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


export class ProgressStatusBar extends StatusBar {
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
			$config.progressStatusBarItem.alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right,
			$config.progressStatusBarItem.priority,
		);
		this.show();
	}

	show() {
		if ($config.progressStatusBarItem.enabled) {
			this.statusBarItem.show();
		} else {
			this.statusBarItem.hide();
		}
	}

	/**
	 * @param tasks All tasks that percentage should be calculated from.
	 */
	update(tasks: TheTask[]) {
		if (!$config.progressStatusBarItem.enabled) {
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
	createStatusBarItem(): void {
		this.dispose();
		this.statusBarItem = window.createStatusBarItem(
			`${Constants.ExtensionMenuPrefix} Main ${Math.random()}`,
			$config.mainStatusBarItem.alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right,
			$config.mainStatusBarItem.priority,
		);
		this.statusBarItem.command = $config.mainStatusBarItem.onClick === 'nothing' ? undefined : CommandId.MainStatusBarCommand;
		this.show();
	}

	show(): void {
		if ($config.mainStatusBarItem.enabled) {
			this.statusBarItem.show();
		} else {
			this.statusBarItem.hide();
		}
	}

	update(fewNextTasks: TheTask[]): void {
		if (!$config.mainStatusBarItem.enabled) {
			return;
		}

		let nextTasksForStatusBar = fewNextTasks;
		if ($config.mainStatusBarItem.targetTasks === 'due') {
			nextTasksForStatusBar = filterTasks(fewNextTasks, '$due').tasks;
		}
		const nextTask = nextTasksForStatusBar[0];

		let formattedTask = nextTasksForStatusBar.length ? formatTask(nextTask) : '';
		if ($config.mainStatusBarItem.truncate) {
			formattedTask = truncate(formattedTask, $config.mainStatusBarItem.truncate);
		}

		this.updateText(formattedTask);

		const isOverdue = nextTask.due?.isDue === IsDue.Overdue;
		const isDue = nextTask.due?.isDue === IsDue.Due;
		this.updateHighlighting(isOverdue ? 'overdue' : isDue ? 'due' : 'notDue');

		const hover = $config.mainStatusBarItem.hoverEnabled ? getTasksHoverMd(nextTasksForStatusBar.slice(0, $config.getNextNumberOfTasks)) : '';
		this.updateHover(hover);
	}

	private updateHighlighting(due: 'due' | 'notDue' | 'overdue'): void {
		this.statusBarItem.color = undefined;
		this.statusBarItem.backgroundColor = undefined;

		if (due === 'notDue') {
			return;
		}

		if (due === 'overdue') {
			this.doHighlight($config.mainStatusBarItem.highlightOverdue);
			return;
		}

		if (due === 'due') {
			this.doHighlight($config.mainStatusBarItem.highlightDue);
			return;
		}
	}

	private doHighlight(highlight: ExtensionConfig['mainStatusBarItem']['highlightDue']): void {
		if (highlight === 'none') {
			return;
		}

		if (highlight === 'errorBg') {
			this.statusBarItem.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
		} else if (highlight === 'errorFg') {
			this.statusBarItem.color = new ThemeColor('editorError.foreground');
		} else if (highlight === 'warningBg') {
			this.statusBarItem.backgroundColor = new ThemeColor('statusBarItem.warningBackground');
		} else if (highlight === 'warningFg') {
			this.statusBarItem.color = new ThemeColor('editorWarning.foreground');
		}
	}
}

export function showCompletedPercentage(tasksCount: number, completedTasksCount: number): string {
	const percentageString = percentage(completedTasksCount, tasksCount).toFixed(1);
	return `${completedTasksCount}/${tasksCount} (${percentageString}%)`;
}
