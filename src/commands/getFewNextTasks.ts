import { window } from 'vscode';
import { extensionConfig, extensionState, updateState } from '../extension';
import { defaultSortTasks } from '../sort';
import { TheTask } from '../TheTask';
import { formatTask } from '../utils/taskUtils';
import { fancyNumber } from '../utils/utils';

export async function getFewNextTasksCommand() {
	await updateState();

	const tasks = getNextFewTasks().slice(0, extensionConfig.getNextNumberOfTasks);

	if (!tasks.length) {
		window.showInformationMessage('No tasks');
		return;
	}

	window.showInformationMessage(tasks.map((task, i) => `${fancyNumber(i + 1)} ${formatTask(task)}`).join('\n'), {
		modal: true,
	});
}

export function getNextFewTasks(): TheTask[] {
	const tasks = extensionState.tasks.filter(t => !t.done);
	return defaultSortTasks(tasks);
}
