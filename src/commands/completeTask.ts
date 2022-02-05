import { ThemeIcon, window } from 'vscode';
import { incrementCountForTask, revealTask, toggleDoneAtLine } from '../documentActions';
import { extensionState, updateState } from '../extension';
import { defaultSortTasks } from '../sort';
import { updateAllTreeViews } from '../treeViewProviders/treeViews';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { formatTask, getTaskAtLineExtension } from '../utils/taskUtils';
import { followLinks } from '../utils/vscodeUtils';

export async function completeTask() {
	// Show Quick Pick to complete a task
	const document = await getActiveOrDefaultDocument();
	// TODO: should this be tree?
	const notCompletedTasks = defaultSortTasks(extensionState.tasks.filter(task => !task.done)).map(task => ({
		label: formatTask(task),
		ln: task.lineNumber,
	}));
	const qp = window.createQuickPick();
	qp.title = 'Complete a task';
	qp.placeholder = 'Choose a task to complete';
	qp.items = notCompletedTasks;
	const enum Buttons {
		followLinkBtn = 'Follow link',
		revealTaskBtn = 'Reveal task',
	}
	qp.buttons = [
		{
			iconPath: new ThemeIcon('link-external'),
			tooltip: Buttons.followLinkBtn,
		},
		{
			iconPath: new ThemeIcon('go-to-file'),
			tooltip: Buttons.revealTaskBtn,
		},
	];
	let activeQuickPickItem: typeof notCompletedTasks[0];
	qp.onDidChangeActive(e => {
		// @ts-ignore
		activeQuickPickItem = e[0];
	});
	qp.onDidTriggerButton(e => {
		const task = getTaskAtLineExtension(activeQuickPickItem.ln);
		if (!task) {
			return;
		}
		if (e.tooltip === Buttons.followLinkBtn) {
			followLinks(task.links);
		} else if (e.tooltip === Buttons.revealTaskBtn) {
			revealTask(task.lineNumber);
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
