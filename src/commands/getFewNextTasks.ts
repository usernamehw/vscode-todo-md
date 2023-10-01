import { window } from 'vscode';
import { TheTask } from '../TheTask';
import { $config, $state, updateState } from '../extension';
import { nextSort } from '../sort';
import { formatTask } from '../utils/taskUtils';
import { fancyNumber } from '../utils/utils';

export async function getFewNextTasksCommand() {
	await updateState();

	const tasks = getNextFewTasks().slice(0, $config.getNextNumberOfTasks);

	if (!tasks.length) {
		window.showInformationMessage('No tasks');
		return;
	}

	window.showInformationMessage(tasks.map((task, i) => `${fancyNumber(i + 1)} ${formatTask(task)}`).join('\n'), {
		modal: true,
	});
}

export function getNextFewTasks(): TheTask[] {
	const tasks = $state.tasks.filter(t => !t.done);
	return nextSort(tasks);
}
