import { MarkdownString, StatusBarAlignment, StatusBarItem, window } from 'vscode';
import { Constants, $config } from './extension';
import { TheTask } from './TheTask';
import { formatTask } from './utils/taskUtils';
import { percentage } from './utils/utils';

abstract class StatusBar {
	protected statusBarItem!: StatusBarItem;

	abstract show(): void;
	abstract update(...args: any[]): void;

	hide(): void {
		this.statusBarItem.hide();
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
		this.statusBarItem = window.createStatusBarItem(`Todo MD: Counter`, StatusBarAlignment.Left, -20000);
		this.statusBarItem.name = `Todo MD: Counter`;
	}

	show() {
		if ($config.statusBarCounterEnabled) {
			this.statusBarItem.show();
		} else {
			this.statusBarItem.hide();
		}
	}

	/**
	 * @param tasks All tasks that percentage should be calculated from.
	 */
	update(tasks: TheTask[]) {
		const completedTasks = tasks.filter(t => t.done);
		const percentageString = percentage(completedTasks.length, tasks.length).toFixed(1);
		this.statusBarItem.text = `${completedTasks.length}/${tasks.length} (${percentageString}%)`;
	}
}

export class MainStatusBar extends StatusBar {
	constructor() {
		super();
		this.statusBarItem = window.createStatusBarItem(`${Constants.ExtensionMenuPrefix} Main`, StatusBarAlignment.Left, -20001);
		this.statusBarItem.name = `${Constants.ExtensionMenuPrefix} Main`;
	}

	show() {
		if ($config.statusBarMainEnabled) {
			this.statusBarItem.show();
		} else {
			this.statusBarItem.hide();
		}
	}

	update(fewNextTasks: TheTask[]) {
		if (!$config.statusBarCounterEnabled) {
			return;
		}
		const firstTaskFormatted = formatTask(fewNextTasks[0]);
		this.updateText(firstTaskFormatted);
		const markdown = new MarkdownString(undefined, true);
		markdown.isTrusted = true;
		// TODO: use markdown formatting instead of formatTask()
		markdown.appendMarkdown(fewNextTasks.slice(0, 10).map((task, i) => `- ${formatTask(task)}`).join('\n'));
		this.updateHover(markdown);
	}
}
