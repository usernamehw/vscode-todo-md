import { QuickInputButton, QuickPickItem, ThemeIcon, window } from 'vscode';
import { TheTask } from '../TheTask';
import { Constants } from '../constants';
import { revealTask, toggleDoneOrIncrementCountAtLines } from '../documentActions';
import { $state, updateState } from '../extension';
import { nextSort } from '../sort';
import { updateAllTreeViews } from '../treeViewProviders/treeViews';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { forEachTask, formatTask, getTaskAtLineExtension } from '../utils/taskUtils';
import { followLinks } from '../utils/vscodeUtils';

/**
 * Show Quick Pick to complete a task.
 */
export async function completeTask() {
	const document = await getActiveOrDefaultDocument();
	const revealTaskInlineButton: QuickInputButton = {
		iconPath: new ThemeIcon('go-to-file'),
		tooltip: 'Reveal task',
	};
	const followLinkInlineButton: QuickInputButton = {
		iconPath: new ThemeIcon('link-external'),
		tooltip: 'Follow link',
	};
	const completeTaskInlineButton: QuickInputButton = {
		iconPath: new ThemeIcon('check'),
		tooltip: 'Complete task',
	};

	const qp = window.createQuickPick();
	qp.title = 'Complete a task';
	qp.placeholder = 'Choose a task to complete';

	qp.items = tasksToQuickPickItems({
		tasks: sortedNotCompletedTasks($state.tasksAsTree),
		revealTaskInlineButton,
		followLinkInlineButton,
		completeTaskInlineButton,
	});

	let activeQuickPickItem: QuickPickItem & { ln: number };
	qp.onDidChangeActive(e => {
		// @ts-ignore
		activeQuickPickItem = e[0];
	});
	qp.onDidTriggerItemButton(async e => {
		// @ts-ignore
		const task = getTaskAtLineExtension(e.item.ln);
		if (!task) {
			return;
		}
		if (e.button.tooltip === followLinkInlineButton.tooltip) {
			followLinks(task.links);
		} else if (e.button.tooltip === revealTaskInlineButton.tooltip) {
			revealTask(task.lineNumber);
		} else if (e.button.tooltip === completeTaskInlineButton.tooltip) {
			// @ts-ignore
			await toggleDoneOrIncrementCountAtLines(await getActiveOrDefaultDocument(), [e.item.ln]);
			await updateState();
			qp.items = tasksToQuickPickItems({
				tasks: sortedNotCompletedTasks($state.tasksAsTree),
				revealTaskInlineButton,
				followLinkInlineButton,
				completeTaskInlineButton,
			});
			return;
		}
		qp.hide();
		qp.dispose();
	});
	qp.onDidAccept(async e => {
		const task = getTaskAtLineExtension(activeQuickPickItem.ln);
		if (!task) {
			return;
		}
		await toggleDoneOrIncrementCountAtLines(document, [task.lineNumber]);
		await updateState();
		updateAllTreeViews();
		qp.dispose();
	});
	qp.show();
}

function sortedNotCompletedTasks(tasks: TheTask[]): TheTask[] {
	return nextSort(tasks)
		.filter(task => !task.done);
}

function tasksToQuickPickItems({
	tasks,
	revealTaskInlineButton,
	followLinkInlineButton,
	completeTaskInlineButton,
}: {
	tasks: TheTask[];
	revealTaskInlineButton: QuickInputButton;
	followLinkInlineButton: QuickInputButton;
	completeTaskInlineButton: QuickInputButton;
}): QuickPickItem[] {
	const flattenedTasks: TheTask[] = [];
	forEachTask((task => {
		if (!task.done) {
			flattenedTasks.push(task);
		}
	}), tasks);

	return flattenedTasks.map(task => ({
		label: `${Constants.NestingSymbol.repeat(task.indentLvl * 4)}${formatTask(task)}`,
		ln: task.lineNumber,
		buttons: [
			task.links.length ? followLinkInlineButton : undefined,
			completeTaskInlineButton,
			revealTaskInlineButton,
		].filter(Boolean),
	} as QuickPickItem));
}
