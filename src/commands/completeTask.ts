import { QuickInputButton, ThemeIcon, window } from 'vscode';
import { incrementCountForTask, revealTask, toggleDoneAtLine } from '../documentActions';
import { $state, updateState } from '../extension';
import { defaultSortTasks } from '../sort';
import { updateAllTreeViews } from '../treeViewProviders/treeViews';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { formatTask, getTaskAtLineExtension } from '../utils/taskUtils';
import { followLinks } from '../utils/vscodeUtils';

export async function completeTask() {
	// TODO: refactor this file
	// Show Quick Pick to complete a task
	const document = await getActiveOrDefaultDocument();
	// TODO: should this be tree?
	const notCompletedTasks = defaultSortTasks($state.tasks.filter(task => !task.done)).map(task => ({
		label: formatTask(task),
		ln: task.lineNumber,
	}));
	const qp = window.createQuickPick();
	qp.title = 'Complete a task';
	qp.placeholder = 'Choose a task to complete';

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

	qp.items = notCompletedTasks.map(notCompletedTask => ({
		...notCompletedTask,
		buttons: [
			revealTaskInlineButton,
			followLinkInlineButton,
			completeTaskInlineButton,
		],
	}));

	let activeQuickPickItem: typeof notCompletedTasks[0];
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
			await toggleDoneAtLine(await getActiveOrDefaultDocument(), e.item.ln);
			await updateState();
			qp.items = defaultSortTasks($state.tasks.filter(t => !t.done)).map(t => ({
				label: formatTask(t),
				ln: t.lineNumber,
			})).map(notCompletedTask => ({
				...notCompletedTask,
				buttons: [
					revealTaskInlineButton,
					followLinkInlineButton,
					completeTaskInlineButton,
				],
			}));
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
		if (task.count) {
			await incrementCountForTask(document, task.lineNumber, task);
		} else {
			await toggleDoneAtLine(document, task.lineNumber);
		}
		await updateState();
		updateAllTreeViews();
		qp.dispose();
	});
	qp.show();
}
